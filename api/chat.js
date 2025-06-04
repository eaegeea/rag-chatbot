import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import { Oso } from 'oso-cloud';
import { generateEmbedding, searchSimilar } from '../src/lib/pinecone.js';

// Initialize clients
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

// Get authorized clients for the user using Oso Cloud
async function getAuthorizedClients(userEmail) {
  try {
    console.log(`🔍 Getting authorized clients for ${userEmail}...`);
    
    // Try to use Oso's buildQuery functionality to get authorized client IDs directly
    try {
      // Import the typedVar function for Oso queries
      const { typedVar } = await import('oso-cloud');
      
      // Build a query to get authorized Client resources
      const actor = { type: 'User', id: userEmail };
      const clientVar = typedVar('Client');
      
      const sqlQuery = await oso
        .buildQuery(['allow', actor, 'view', clientVar])
        .evaluateLocalSelect({ client_id: clientVar });
      
      console.log(`✅ Generated Oso SQL query:`, sqlQuery);
      
      // Execute the SQL query against our database to get authorized client IDs
      const result = await prisma.$queryRawUnsafe(sqlQuery);
      console.log(`✅ Query result:`, result);
      
      // Extract client IDs from the result
      const authorizedClientIds = result.map(row => parseInt(row.client_id)).filter(id => !isNaN(id));
      
      if (authorizedClientIds.length === 0) {
        return [];
      }
      
      // Fetch only the authorized clients from the database
      const authorizedClients = await prisma.client.findMany({
        where: {
          id: { in: authorizedClientIds }
        },
        include: {
          assigned_user: true,
          region: true
        }
      });
      
      console.log(`✅ Retrieved ${authorizedClients.length} client records from database`);
      return authorizedClients;
      
    } catch (buildQueryError) {
      console.log('⚠️  Oso buildQuery method failed, falling back to individual authorization checks:', buildQueryError.message);
      
      // Fallback to the original approach if buildQuery method doesn't work
      const allClients = await prisma.client.findMany({
        include: {
          assigned_user: true,
          region: true
        }
      });
      
      if (allClients.length === 0) {
        return [];
      }
      
      console.log(`🔍 Checking access to ${allClients.length} clients individually...`);
      
      // Use Oso to check authorization for each client
      const authorizedClients = [];
      
      // Process in batches to avoid overwhelming Oso
      const batchSize = 10;
      for (let i = 0; i < allClients.length; i += batchSize) {
        const batch = allClients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (client) => {
          try {
            const result = await oso.authorize(
              { type: 'User', id: userEmail },
              'view',
              { type: 'Client', id: client.id.toString() }
            );
            
            return result ? client : null;
          } catch (authError) {
            console.error(`Authorization check failed for client ${client.id}:`, authError);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        authorizedClients.push(...batchResults.filter(client => client !== null));
      }
      
      console.log(`✅ User ${userEmail} has access to ${authorizedClients.length} clients (fallback method)`);
      return authorizedClients;
    }
    
  } catch (error) {
    console.error('Error getting authorized clients:', error);
    return [];
  }
}

// Check if the query is asking for a client list
function isClientListQuery(prompt) {
  const listKeywords = [
    'who are my clients',
    'my clients',
    'list of clients',
    'show me my clients',
    'what clients do i have',
    'clients i work with',
    'my client list',
    'which clients',
    'clients assigned to me'
  ];
  
  const normalizedPrompt = prompt.toLowerCase();
  return listKeywords.some(keyword => normalizedPrompt.includes(keyword));
}

// Generate client list response
async function generateClientListResponse(userEmail) {
  try {
    const authorizedClients = await getAuthorizedClients(userEmail);
    
    // Get user info for context
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { region: true }
    });
    
    if (authorizedClients.length === 0) {
      return user ? 
        `You don't currently have any clients assigned to you. This could be because:
        
• No clients have been assigned to your account yet
• There may be an issue with your permissions
• Your role (${user.role}) may not have client assignments

Please contact your sales manager for assistance.` :
        'No clients found for your account.';
    }
    
    // Group clients by region for better organization
    const clientsByRegion = authorizedClients.reduce((acc, client) => {
      const regionName = client.region?.name || 'Unknown Region';
      if (!acc[regionName]) acc[regionName] = [];
      acc[regionName].push(client);
      return acc;
    }, {});
    
    let response = `Here are your authorized clients:\n\n`;
    
    // Add role context
    if (user) {
      response += `**Your Role**: ${user.role === 'salesmanager' ? 'Sales Manager' : 'Salesperson'} - ${user.region?.name || 'Unknown'} Region\n\n`;
    }
    
    // List clients by region
    Object.entries(clientsByRegion).forEach(([regionName, clients]) => {
      response += `**${regionName} Region** (${clients.length} clients):\n`;
      clients.forEach(client => {
        const assignedTo = client.assigned_user ? ` - Assigned to: ${client.assigned_user.name}` : '';
        response += `• **${client.name}** at ${client.company}${assignedTo}\n`;
      });
      response += '\n';
    });
    
    response += `**Total**: ${authorizedClients.length} client${authorizedClients.length !== 1 ? 's' : ''}\n\n`;
    response += `You can ask me specific questions about any of these clients, such as:\n`;
    response += `• "What are John Peterson's concerns?"\n`;
    response += `• "Show me pricing discussions for Sarah Wilson"\n`;
    response += `• "What's the deal size for any client?"`;
    
    return response;
  } catch (error) {
    console.error('Error generating client list response:', error);
    return 'Sorry, I encountered an error while retrieving your client list. Please try again.';
  }
}

// Get authorized client note IDs for the user using Oso Cloud (oso.authorize only)
async function getAuthorizedClientNoteIds(userEmail) {
  try {
    console.log(`🔍 Getting authorized client note IDs for ${userEmail}...`);
    
    // Get all client notes with their client relationships
    const allClientNotes = await prisma.clientNote.findMany({
      select: { 
        id: true, 
        client_id: true 
      }
    });
    
    if (allClientNotes.length === 0) {
      return [];
    }
    
    // Get unique client IDs
    const uniqueClientIds = [...new Set(allClientNotes.map(note => note.client_id))];
    
    console.log(`🔍 Checking access to ${uniqueClientIds.length} clients individually...`);
    
    // Use Oso to check authorization for each client
    const authorizedClientIds = [];
    
    // Process in batches to avoid overwhelming Oso
    const batchSize = 10;
    for (let i = 0; i < uniqueClientIds.length; i += batchSize) {
      const batch = uniqueClientIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (clientId) => {
        try {
          const result = await oso.authorize(
            { type: 'User', id: userEmail },
            'view',
            { type: 'Client', id: clientId.toString() }
          );
          
          // Add detailed logging to debug authorization
          console.log(`🔐 Authorization check: ${userEmail} -> Client ${clientId}: ${result ? '✅ ALLOWED' : '❌ DENIED'}`);
          
          return result ? clientId : null;
        } catch (authError) {
          console.error(`Authorization check failed for client ${clientId}:`, authError);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      authorizedClientIds.push(...batchResults.filter(id => id !== null));
    }
    
    console.log(`✅ User ${userEmail} has access to ${authorizedClientIds.length} clients (fallback method)`);
    console.log(`📋 Authorized client IDs: [${authorizedClientIds.join(', ')}]`);
    
    // If user has access to a client, they have access to all notes for that client
    const authorizedNoteIds = allClientNotes
      .filter(note => authorizedClientIds.includes(note.client_id))
      .map(note => note.id);
    
    console.log(`✅ User can access ${authorizedNoteIds.length} client notes (fallback method)`);
    console.log(`📋 Authorized note IDs: [${authorizedNoteIds.sort((a, b) => a - b).join(', ')}]`);
    
    // DEBUGGING: Check for Lisa Garcia content in authorized notes
    if (userEmail === 'alice@company.com') {
      console.log(`\n🔍 DEBUGGING: Checking Alice's authorized notes for Lisa Garcia content...`);
      
      const authorizedNotesWithContent = await prisma.clientNote.findMany({
        where: {
          id: { in: authorizedNoteIds }
        },
        include: {
          client: true
        }
      });
      
      const lisaGarciaMentions = authorizedNotesWithContent.filter(note => 
        note.content.toLowerCase().includes('lisa garcia') ||
        note.content.toLowerCase().includes('innovation labs')
      );
      
      if (lisaGarciaMentions.length > 0) {
        console.log(`🚨 SECURITY BREACH: Found ${lisaGarciaMentions.length} notes mentioning Lisa Garcia in Alice's authorized list:`);
        lisaGarciaMentions.forEach(note => {
          console.log(`   ❌ Note ${note.id} → Client ${note.client_id} (${note.client.name})`);
          console.log(`      Content: "${note.content.substring(0, 100)}..."`);
        });
      } else {
        console.log(`✅ No Lisa Garcia content found in Alice's authorized notes`);
      }
    }
    
    return authorizedNoteIds;
    
  } catch (error) {
    console.error('Error getting authorized client note IDs:', error);
    return [];
  }
}

// Get authorized blocks with similarity search using Pinecone (using Pinecone as source of truth)
async function getAuthorizedBlocks(userEmail, promptEmbedding, threshold = 0.3) {
  try {
    // Get authorized client IDs (but don't get note IDs from database)
    const allClientNotes = await prisma.clientNote.findMany({
      select: { 
        id: true, 
        client_id: true 
      }
    });
    
    if (allClientNotes.length === 0) {
      return [];
    }
    
    // Get unique client IDs
    const uniqueClientIds = [...new Set(allClientNotes.map(note => note.client_id))];
    
    console.log(`🔍 Checking access to ${uniqueClientIds.length} clients individually...`);
    
    // Use Oso to check authorization for each client
    const authorizedClientIds = [];
    
    // Process in batches to avoid overwhelming Oso
    const batchSize = 10;
    for (let i = 0; i < uniqueClientIds.length; i += batchSize) {
      const batch = uniqueClientIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (clientId) => {
        try {
          const result = await oso.authorize(
            { type: 'User', id: userEmail },
            'view',
            { type: 'Client', id: clientId.toString() }
          );
          
          console.log(`🔐 Authorization check: ${userEmail} -> Client ${clientId}: ${result ? '✅ ALLOWED' : '❌ DENIED'}`);
          
          return result ? clientId : null;
        } catch (authError) {
          console.error(`Authorization check failed for client ${clientId}:`, authError);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      authorizedClientIds.push(...batchResults.filter(id => id !== null));
    }
    
    console.log(`✅ User ${userEmail} has access to ${authorizedClientIds.length} clients`);
    console.log(`📋 Authorized client IDs: [${authorizedClientIds.join(', ')}]`);
    
    if (authorizedClientIds.length === 0) {
      console.log(`❌ No authorized clients found for ${userEmail}`);
      return [];
    }
    
    // Search Pinecone with minimal filter to satisfy requirements - use metadata for authorization
    console.log(`🔍 Searching Pinecone with semantic search and metadata-based authorization...`);
    
    const searchResults = await searchSimilar(promptEmbedding, {
      topK: 20, // Get more results since we'll filter them
      filter: {
        client_note_id: { $gte: 1 } // Minimal filter that doesn't restrict - all note IDs >= 1
      },
      includeMetadata: true
    });
    
    console.log(`📊 Pinecone returned ${searchResults.length} results before authorization filtering`);
    
    // Filter results using Pinecone metadata as source of truth
    const authorizedResults = searchResults.filter(match => {
      // Use Pinecone metadata directly - NO database lookups
      let clientId = null;
      
      if (match.metadata?.client_id) {
        clientId = parseInt(match.metadata.client_id);
      }
      
      const isAuthorized = clientId && authorizedClientIds.includes(clientId);
      
      if (!isAuthorized && clientId) {
        console.log(`🚨 SECURITY FILTER: User ${userEmail} blocked from accessing Client ${clientId} content (Pinecone metadata)`);
        console.log(`   Note ID: ${match.metadata?.client_note_id}, Client in Pinecone: ${match.metadata?.client_name}`);
      }
      
      if (isAuthorized) {
        console.log(`✅ AUTHORIZED: User ${userEmail} accessing Client ${clientId} content (${match.metadata?.client_name})`);
      }
      
      return isAuthorized;
    });
    
    console.log(`✅ After Pinecone metadata authorization: ${authorizedResults.length} authorized results`);
    
    // Filter by similarity threshold and format results
    const relevantBlocks = authorizedResults
      .filter(match => match.score >= threshold)
      .map(match => ({
        id: match.id,
        client_note_id: match.metadata.client_note_id,
        content: match.metadata.content,
        similarity: match.score,
        client_name: match.metadata.client_name,
        company: match.metadata.company
      }));
    
    // Final security check - log what data is being returned
    relevantBlocks.forEach(block => {
      console.log(`📄 Returning authorized content for ${userEmail}: Client "${block.client_name}" (Note ID: ${block.client_note_id})`);
    });
    
    console.log(`🎯 Final results: ${relevantBlocks.length} blocks above similarity threshold ${threshold}`);
    
    return relevantBlocks;
  } catch (error) {
    console.error('Error in getAuthorizedBlocks:', error);
    return [];
  }
}

// Generate chatbot response
async function generateChatbotResponse(prompt, context = [], userEmail = '') {
  // Get user info for permission context
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { region: true }
  });

  // Format context for the system prompt
  const contextText = context.length > 0 
    ? context.map((item, index) => 
        `Context ${index + 1} (Similarity: ${item.similarity?.toFixed(3) || 'N/A'}):\n${item.content}`
      ).join('\n\n')
    : 'No relevant context found.';

  // Create permission-aware no-context message
  const noContextMessage = user ? 
    `I don't have access to information about that topic in your authorized client notes. This could be because:

• The information doesn't exist in the available client notes
• You don't have permission to access that specific information
• The topic might relate to clients outside your ${user.role === 'salesmanager' ? `${user.region?.name || 'assigned'} region` : 'assigned client list'}

${user.role === 'salesmanager' 
  ? `As a ${user.region?.name || ''} region manager, you can access all client information within your region.` 
  : 'As a salesperson, you can only access information about your assigned clients.'}

Try asking about topics related to your authorized clients, such as:
• Client concerns and feedback
• Pricing discussions
• Product requirements
• Integration challenges` 
    : 'No relevant information found in your accessible client notes.';

  const systemPrompt = `You are a helpful sales assistant AI for ACME that provides information based on client notes and sales data.

Given the following context from client notes and sales interactions, answer the user's question using this information as the primary source.

You can supplement the information with general sales knowledge, but be sure to distinguish between specific context from the notes and general information.

If you are unsure and the answer is not explicitly written in the context provided, or if no context is available, explain that the information might not be accessible due to authorization restrictions.

Context from client notes:
${contextText}

Guidelines:
- Be professional and helpful
- Focus on actionable insights
- Distinguish between specific client feedback and general advice
- Respect confidentiality - only reference information that's in the provided context
- Answer in a conversational tone
- Use "clients" instead of "customers" when referring to ACME's business relationships
- If no context is available, explain potential permission/access reasons`;

  // If no context found, return permission-aware message
  if (context.length === 0) {
    return noContextMessage;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, message } = req.body;

    if (!user || !message) {
      return res.status(400).json({ error: 'User and message are required' });
    }

    // If no OpenAI API key, return demo response
    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        response: "I'm running in demo mode without OpenAI integration. Please add your OPENAI_API_KEY to the .env file to enable full RAG functionality.",
        contextCount: 0,
        demo: true
      });
    }

    // Check if this is a client list query
    if (isClientListQuery(message)) {
      const clientListResponse = await generateClientListResponse(user);
      return res.status(200).json({
        response: clientListResponse,
        contextCount: 0,
        demo: false,
        queryType: 'client_list'
      });
    }

    // For other queries, use the normal RAG pipeline
    // Generate embedding for the user's question
    const questionEmbedding = await generateEmbedding(message);

    // Get authorized blocks based on user's permissions
    const authorizedBlocks = await getAuthorizedBlocks(user, questionEmbedding, 0.3);

    // Generate response using the authorized context
    const response = await generateChatbotResponse(message, authorizedBlocks, user);

    return res.status(200).json({
      response,
      contextCount: authorizedBlocks.length,
      demo: false,
      queryType: 'rag_search'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
} 