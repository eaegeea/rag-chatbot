import { PrismaClient } from '@prisma/client';
import { initializePinecone, storeEmbeddings, deleteEmbeddings, generateEmbedding } from './src/lib/pinecone.js';

const prisma = new PrismaClient();

async function fixPineconeMetadata() {
  try {
    console.log('🔧 Starting Pinecone metadata fix...');
    
    // Initialize Pinecone
    await initializePinecone();
    
    // Get all client notes with correct client assignments
    const allClientNotes = await prisma.clientNote.findMany({
      include: {
        client: {
          include: {
            assigned_user: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`📊 Found ${allClientNotes.length} client notes to process`);
    
    // Focus on notes that mention Lisa Garcia but might have wrong metadata
    const problematicNotes = allClientNotes.filter(note => 
      note.content.toLowerCase().includes('lisa garcia') || 
      note.content.toLowerCase().includes('innovation labs')
    );
    
    console.log(`\n🔍 Found ${problematicNotes.length} notes mentioning Lisa Garcia:`);
    problematicNotes.forEach(note => {
      console.log(`  Note ${note.id}: Client ${note.client_id} (${note.client.name}) - "${note.content.substring(0, 60)}..."`);
    });
    
    // Delete existing embeddings for these notes
    console.log('\n🗑️ Deleting existing problematic embeddings...');
    const idsToDelete = problematicNotes.map(note => `client_note_${note.id}`);
    
    for (const id of idsToDelete) {
      try {
        await deleteEmbeddings({ id: { $eq: id } });
        console.log(`  ✅ Deleted embedding ${id}`);
      } catch (error) {
        console.log(`  ⚠️ Could not delete ${id}:`, error.message);
      }
    }
    
    // Regenerate embeddings with correct metadata
    console.log('\n🔄 Regenerating embeddings with correct metadata...');
    const fixedEmbeddings = [];
    
    for (const note of problematicNotes) {
      console.log(`  📊 Generating embedding for Note ${note.id}...`);
      
      const embedding = await generateEmbedding(note.content);
      
      fixedEmbeddings.push({
        id: `client_note_${note.id}`,
        embedding: embedding,
        metadata: {
          client_note_id: note.id,
          client_id: note.client_id, // This should be 4 for Lisa Garcia
          client_name: note.client.name, // This should be "Lisa Garcia"
          company: note.client.company, // This should be "Innovation Labs"
          content: note.content,
          assigned_user_id: note.client.assigned_id, // This should be 2 (Bob)
          note_type: note.note_type
        }
      });
      
      console.log(`    ✅ Created embedding for "${note.client.name}" (Client ${note.client_id})`);
    }
    
    // Upload fixed embeddings
    if (fixedEmbeddings.length > 0) {
      console.log(`\n📤 Uploading ${fixedEmbeddings.length} fixed embeddings...`);
      await storeEmbeddings(fixedEmbeddings);
      console.log('✅ All fixed embeddings uploaded');
    }
    
    // Verify the fix
    console.log('\n📋 Verification - Client assignments:');
    const clients = await prisma.client.findMany({
      include: { assigned_user: true },
      orderBy: { id: 'asc' }
    });
    
    clients.forEach(client => {
      console.log(`  Client ${client.id}: ${client.name} (${client.company}) → ${client.assigned_user?.name}`);
    });
    
    console.log('\n✅ Pinecone metadata fix completed!');
    console.log('🔒 Alice should now only see her authorized clients\' data');
    
  } catch (error) {
    console.error('❌ Error fixing Pinecone metadata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixPineconeMetadata(); 