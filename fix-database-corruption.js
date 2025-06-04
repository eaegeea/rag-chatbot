import { PrismaClient } from '@prisma/client';
import { deleteEmbeddings, storeEmbeddings, generateEmbedding } from './src/lib/pinecone.js';

const prisma = new PrismaClient();

async function fixDatabaseCorruption() {
  try {
    console.log('🔧 Starting database corruption fix...\n');
    
    // Get Lisa Garcia's client ID
    const lisaClient = await prisma.client.findFirst({
      where: { name: 'Lisa Garcia' }
    });
    
    if (!lisaClient) {
      throw new Error('Lisa Garcia client not found!');
    }
    
    console.log(`👤 Lisa Garcia is Client ID: ${lisaClient.id}`);
    
    // Check current assignments for notes 66-80
    console.log('\\n📊 Current note assignments for IDs 66-80:');
    const problematicNotes = await prisma.clientNote.findMany({
      where: {
        id: { gte: 66, lte: 80 }
      },
      include: {
        client: true
      },
      orderBy: { id: 'asc' }
    });
    
    let lisaContentNotes = [];
    
    problematicNotes.forEach(note => {
      const hasLisaContent = note.content.toLowerCase().includes('lisa garcia') || 
                            note.content.toLowerCase().includes('innovation labs');
      console.log(`  Note ${note.id}: Client ${note.client_id} (${note.client.name}) ${hasLisaContent ? '🚨 HAS LISA CONTENT' : ''}`);
      console.log(`    Content: "${note.content.substring(0, 80)}..."`);
      
      if (hasLisaContent) {
        lisaContentNotes.push(note);
      }
    });
    
    console.log(`\\n🔍 Found ${lisaContentNotes.length} notes with Lisa Garcia content assigned to wrong clients`);
    
    if (lisaContentNotes.length > 0) {
      console.log('\\n🔧 Fixing assignments...');
      
      // Update each note to point to Lisa Garcia's client
      for (const note of lisaContentNotes) {
        console.log(`  Moving Note ${note.id} from Client ${note.client_id} to Client ${lisaClient.id}`);
        
        await prisma.clientNote.update({
          where: { id: note.id },
          data: { client_id: lisaClient.id }
        });
      }
      
      console.log('\\n✅ Database assignments fixed!');
      console.log('\\n🔄 Now fixing Pinecone metadata...');
      
      // Fix Pinecone metadata
      for (const note of lisaContentNotes) {
        const vectorId = `client_note_${note.id}`;
        
        try {
          // Delete old embedding
          await deleteEmbeddings([vectorId]);
          console.log(`  Deleted old embedding: ${vectorId}`);
          
          // Generate new embedding with correct metadata
          const embedding = await generateEmbedding(note.content);
          
          await storeEmbeddings([{
            id: vectorId,
            values: embedding,
            metadata: {
              client_note_id: note.id,
              content: note.content,
              note_type: note.note_type || 'general',
              client_name: 'Lisa Garcia',
              company: 'Innovation Labs'
            }
          }]);
          
          console.log(`  Created new embedding: ${vectorId} with correct metadata`);
        } catch (error) {
          console.error(`  ❌ Error fixing embedding ${vectorId}:`, error.message);
        }
      }
      
      console.log('\\n✅ All fixes completed!');
    } else {
      console.log('\\n✅ No corruption found - all assignments are correct');
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDatabaseCorruption(); 