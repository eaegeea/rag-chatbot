import { PrismaClient } from '@prisma/client';
import { generateEmbedding, storeEmbeddings, initializePinecone, getIndexStats } from './lib/pinecone.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function initializePineconeWithData() {
  console.log('🚀 Initializing Pinecone with client notes...');
  
  try {
    // Initialize Pinecone
    await initializePinecone();
    
    // Get all client notes from the database
    const clientNotes = await prisma.clientNote.findMany({
      include: {
        client: {
          include: {
            region: true,
            assigned_user: true
          }
        }
      }
    });
    
    console.log(`📝 Found ${clientNotes.length} client notes to process`);
    
    if (clientNotes.length === 0) {
      console.log('⚠️ No client notes found. Make sure to run database seeding first.');
      return;
    }
    
    // Generate embeddings for all client notes
    const vectors = [];
    
    for (let i = 0; i < clientNotes.length; i++) {
      const note = clientNotes[i];
      
      console.log(`🔄 Processing note ${i + 1}/${clientNotes.length}: "${note.content.substring(0, 50)}..."`);
      
      try {
        const embedding = await generateEmbedding(note.content);
        
        vectors.push({
          id: `note_${note.id}`,
          embedding,
          metadata: {
            client_note_id: note.id,
            client_id: note.client_id,
            content: note.content,
            note_type: note.note_type,
            client_name: note.client.name,
            client_company: note.client.company,
            region_id: note.client.region_id,
            region_name: note.client.region.name,
            assigned_user_id: note.client.assigned_id,
            assigned_user_email: note.client.assigned_user.email
          }
        });
      } catch (error) {
        console.error(`❌ Error processing note ${note.id}:`, error.message);
      }
    }
    
    if (vectors.length === 0) {
      console.log('❌ No embeddings generated. Check your OpenAI API key.');
      return;
    }
    
    // Store embeddings in Pinecone
    console.log(`📤 Storing ${vectors.length} embeddings in Pinecone...`);
    await storeEmbeddings(vectors);
    
    // Get index stats
    const stats = await getIndexStats();
    console.log('📊 Pinecone index stats:', stats);
    
    console.log('✅ Pinecone initialization complete!');
    
  } catch (error) {
    console.error('❌ Error initializing Pinecone:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializePineconeWithData()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

export { initializePineconeWithData }; 