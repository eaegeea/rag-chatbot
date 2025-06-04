import { Oso } from 'oso-cloud';
import Debug from 'debug';

const debug = Debug('auth');

// Initialize Oso Cloud client
const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

// Initialize Oso with facts (users, regions, customers, etc.)
export async function initializeOsoData() {
  try {
    debug('Initializing Oso Cloud with authorization data...');
    
    // This would typically be done through the Oso Cloud UI or API
    // For this demo, we'll assume the policy and facts are already loaded
    // The user will configure this through the Oso Cloud UI as mentioned
    
    debug('Oso Cloud data initialization complete');
    return true;
  } catch (error) {
    debug('Error initializing Oso data:', error);
    throw new Error(`Failed to initialize Oso: ${error.message}`);
  }
}

// Check if a user can read a specific client note (hybrid approach using Client authorization)
export async function canUserReadClientNote(userEmail, clientNoteId) {
  try {
    debug(`Checking if ${userEmail} can read client note ${clientNoteId}`);
    
    // Import here to avoid circular dependency
    const prisma = (await import('./database.js')).default;
    
    // Get the client note and its associated client
    const clientNote = await prisma.clientNote.findUnique({
      where: { id: parseInt(clientNoteId) },
      select: { client_id: true }
    });
    
    if (!clientNote) {
      debug(`Client note ${clientNoteId} not found`);
      return false;
    }
    
    // Check if user can view the client using Oso
    const result = await oso.authorize(
      { type: 'User', id: userEmail },
      'view',
      { type: 'Client', id: clientNote.client_id.toString() }
    );
    
    debug(`Authorization result for client ${clientNote.client_id}: ${result}`);
    return result;
  } catch (error) {
    debug('Error checking authorization:', error);
    return false;
  }
}

// Get authorization filter for client notes that a user can read
export async function getClientNoteAuthorizationFilter(userEmail) {
  try {
    debug(`Getting authorization filter for user: ${userEmail}`);
    
    const result = await oso.buildQuery(
      { type: 'User', id: userEmail },
      'read',
      { type: 'ClientNote' }
    );
    
    // Convert Oso query to SQL WHERE clause
    // This is a simplified version - in practice, you'd need more complex query building
    const sqlFilter = convertOsoQueryToSQL(result);
    
    debug(`Generated SQL filter: ${sqlFilter}`);
    return sqlFilter;
  } catch (error) {
    debug('Error getting authorization filter:', error);
    // Fallback to restrictive filter if authorization fails
    return '1 = 0'; // No access
  }
}

// Convert Oso query result to SQL WHERE clause
function convertOsoQueryToSQL(osoQuery) {
  // This is a simplified implementation
  // In a real application, you'd need more sophisticated query building
  // based on your specific Oso policy structure
  
  if (!osoQuery || !osoQuery.query) {
    return '1 = 0'; // No access by default
  }
  
  // For this demo, we'll create filters based on common patterns
  // The actual implementation would depend on your Oso policy structure
  
  // Example SQL filters for our sales scenario:
  // - Salespeople can only see notes from their assigned customers
  // - Sales managers can see all notes in their region
  
  // This would be generated based on the Oso query result
  // For demo purposes, returning a placeholder that works with our schema
  return 'client_note_id IN (SELECT id FROM client_notes)';
}

// Get blocks that user is authorized to see with similarity search
export async function getAuthorizedBlocks(userEmail, promptEmbedding, threshold = 0.3) {
  try {
    debug(`Getting authorized blocks for user: ${userEmail}`);
    
    // Get the authorization filter
    const authFilter = await getClientNoteAuthorizationFilter(userEmail);
    
    // For this demo, we'll implement a simplified authorization check
    // In practice, you'd use the actual Oso-generated SQL filter
    const authorizedBlocks = await getBlocksWithAuthCheck(userEmail, promptEmbedding, threshold);
    
    debug(`Found ${authorizedBlocks.length} authorized blocks`);
    return authorizedBlocks;
  } catch (error) {
    debug('Error getting authorized blocks:', error);
    return [];
  }
}

// Helper function to get blocks with authorization check using Oso (hybrid approach)
async function getBlocksWithAuthCheck(userEmail, promptEmbedding, threshold) {
  // Import here to avoid circular dependency
  const prisma = (await import('./database.js')).default;
  
  try {
    // Get all blocks from the database with client note relationships
    const allBlocks = await prisma.block.findMany({
      select: { 
        id: true, 
        client_note_id: true, 
        content: true,
        embedding: true 
      },
      include: {
        client_note: {
          select: { client_id: true }
        }
      }
    });
    
    if (allBlocks.length === 0) {
      return [];
    }
    
    // Get unique client IDs from blocks
    const uniqueClientIds = [...new Set(allBlocks.map(block => block.client_note.client_id))];
    
    // Use Oso to check authorization for each client
    const authorizedClientIds = [];
    
    // Process in batches for better performance
    const batchSize = 10;
    for (let i = 0; i < uniqueClientIds.length; i += batchSize) {
      const batch = uniqueClientIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (clientId) => {
        try {
          // Check if user can view the client using Oso
          const result = await oso.authorize(
            { type: 'User', id: userEmail },
            'view',
            { type: 'Client', id: clientId.toString() }
          );
          
          return result ? clientId : null;
        } catch (authError) {
          debug(`Authorization check failed for client ${clientId}:`, authError);
          return null;
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      authorizedClientIds.push(...batchResults.filter(id => id !== null));
    }
    
    // Filter blocks based on authorized clients and calculate similarity
    const authorizedBlocks = [];
    
    for (const block of allBlocks) {
      if (authorizedClientIds.includes(block.client_note.client_id)) {
        // Calculate similarity if user is authorized
        const embeddingArray = block.embedding;
        let similarity = 0;
        
        if (embeddingArray && promptEmbedding) {
          // Calculate cosine similarity
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;
          
          for (let j = 0; j < Math.min(embeddingArray.length, promptEmbedding.length); j++) {
            dotProduct += embeddingArray[j] * promptEmbedding[j];
            normA += embeddingArray[j] * embeddingArray[j];
            normB += promptEmbedding[j] * promptEmbedding[j];
          }
          
          similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
        }
        
        authorizedBlocks.push({
          id: block.id,
          client_note_id: block.client_note_id,
          content: block.content,
          similarity: similarity
        });
      }
    }
    
    // Filter by similarity threshold and sort by similarity
    return authorizedBlocks
      .filter(block => block.similarity > threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);
      
  } catch (error) {
    debug('Error in getBlocksWithAuthCheck:', error);
    return [];
  }
}

// Test Oso connection
export async function testOsoConnection() {
  try {
    // Simple test to verify Oso connection
    await oso.get('/api/policy');
    debug('Oso Cloud connection successful');
    return true;
  } catch (error) {
    debug('Oso Cloud connection failed:', error);
    return false;
  }
}

export default oso; 