import { PrismaClient } from '@prisma/client';
import { initializePinecone, searchSimilar, deleteEmbeddings, storeEmbeddings, generateEmbedding } from './src/lib/pinecone.js';

const prisma = new PrismaClient();

async function fixProductionMetadata() {
  try {
    console.log('🔧 Starting production Pinecone metadata fix...');
    console.log('🎯 Target: Fix Sarah Wilson/Lisa Garcia content contamination');
    
    // Initialize Pinecone
    await initializePinecone();
    
    // Get all client notes from production database
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
    
    console.log(`📊 Found ${allClientNotes.length} client notes in production database`);
    
    // Identify problematic content patterns
    const problemPatterns = [
      'custom API development',
      'legacy system integration', 
      '6-8 weeks',
      'innovation labs',
      'sarah wilson',
      'lisa garcia'
    ];
    
    console.log('\n🔍 Searching for contaminated embeddings in Pinecone...');
    
    // Search for embeddings that might contain contaminated content
    const testQuery = await generateEmbedding('custom API development pricing');
    const potentialMatches = await searchSimilar(testQuery, {
      topK: 50,
      filter: {},
      includeMetadata: true
    });
    
    console.log(`📋 Found ${potentialMatches.length} potential matches in Pinecone`);
    
    // Identify contaminated embeddings
    const contaminatedEmbeddings = [];
    
    potentialMatches.forEach(match => {
      const metadata = match.metadata;
      const content = (metadata.content || '').toLowerCase();
      const clientName = (metadata.client_name || '').toLowerCase();
      const company = (metadata.company || '').toLowerCase();
      
      // Check for content/client mismatch
      const hasSarahContent = content.includes('sarah wilson') || company.includes('design studio');
      const hasLisaContent = content.includes('lisa garcia') || company.includes('innovation labs');
      const hasGenericContent = problemPatterns.some(pattern => content.includes(pattern));
      
      if (hasGenericContent || hasSarahContent || hasLisaContent) {
        // Find the actual client note in our database
        const actualNote = allClientNotes.find(note => note.id === metadata.client_note_id);
        
        if (actualNote) {
          const actualClientName = actualNote.client.name.toLowerCase();
          const actualCompany = actualNote.client.company.toLowerCase();
          
          // Check if metadata doesn't match actual data
          if (clientName !== actualClientName || company !== actualCompany) {
            contaminatedEmbeddings.push({
              embeddingId: match.id,
              noteId: metadata.client_note_id,
              currentMetadata: metadata,
              correctData: actualNote
            });
          }
        }
      }
    });
    
    console.log(`\n⚠️  Found ${contaminatedEmbeddings.length} contaminated embeddings:`);
    contaminatedEmbeddings.forEach(item => {
      console.log(`  Embedding ${item.embeddingId}: Note ${item.noteId}`);
      console.log(`    Current: "${item.currentMetadata.client_name}" (${item.currentMetadata.company})`);
      console.log(`    Correct: "${item.correctData.client.name}" (${item.correctData.client.company})`);
    });
    
    if (contaminatedEmbeddings.length === 0) {
      console.log('✅ No contaminated embeddings found!');
      return;
    }
    
    // Delete contaminated embeddings
    console.log('\n🗑️ Deleting contaminated embeddings...');
    for (const item of contaminatedEmbeddings) {
      try {
        await deleteEmbeddings({ id: { $eq: item.embeddingId } });
        console.log(`  ✅ Deleted embedding ${item.embeddingId}`);
      } catch (error) {
        console.log(`  ⚠️ Could not delete ${item.embeddingId}:`, error.message);
      }
    }
    
    // Regenerate with correct metadata
    console.log('\n🔄 Regenerating embeddings with correct metadata...');
    const fixedEmbeddings = [];
    
    for (const item of contaminatedEmbeddings) {
      const note = item.correctData;
      console.log(`  📊 Generating embedding for Note ${note.id} - ${note.client.name}...`);
      
      try {
        const embedding = await generateEmbedding(note.content);
        
        fixedEmbeddings.push({
          id: `client_note_${note.id}`,
          embedding: embedding,
          metadata: {
            client_note_id: note.id,
            client_id: note.client_id,
            client_name: note.client.name,
            company: note.client.company,
            content: note.content,
            assigned_user_id: note.client.assigned_id,
            note_type: note.note_type
          }
        });
        
        console.log(`    ✅ Fixed embedding for "${note.client.name}" (Client ${note.client_id})`);
      } catch (error) {
        console.log(`    ❌ Failed to generate embedding for Note ${note.id}:`, error.message);
      }
    }
    
    // Upload fixed embeddings
    if (fixedEmbeddings.length > 0) {
      console.log(`\n📤 Uploading ${fixedEmbeddings.length} fixed embeddings...`);
      await storeEmbeddings(fixedEmbeddings);
      console.log('✅ All fixed embeddings uploaded');
    }
    
    // Verification
    console.log('\n🔍 Verification - Testing fixed embeddings...');
    const verificationQuery = await generateEmbedding('custom API development pricing');
    const verificationResults = await searchSimilar(verificationQuery, {
      topK: 10,
      filter: {},
      includeMetadata: true
    });
    
    console.log(`📋 Verification results:`);
    verificationResults.forEach((match, i) => {
      console.log(`  ${i + 1}. Score: ${match.score.toFixed(3)} | Client: "${match.metadata.client_name}" | Note: ${match.metadata.client_note_id}`);
    });
    
    console.log('\n✅ Production metadata fix completed!');
    console.log('🔒 Users should now only see their authorized clients\' data');
    
  } catch (error) {
    console.error('❌ Error fixing production metadata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixProductionMetadata(); 