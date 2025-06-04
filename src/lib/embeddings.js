import { generateEmbedding } from './ai.js';
import prisma from './database.js';
import Debug from 'debug';

const debug = Debug('embeddings');

// Create blocks with embeddings from customer notes
export async function generateEmbeddingsForCustomerNotes() {
  try {
    debug('Starting embedding generation for customer notes...');
    
    // Get all customer notes that don't have blocks yet
    const customerNotes = await prisma.customerNote.findMany({
      where: {
        blocks: {
          none: {}
        }
      },
      include: {
        customer: {
          include: {
            salesperson: true,
            region: true
          }
        }
      }
    });
    
    debug(`Found ${customerNotes.length} customer notes without embeddings`);
    
    let processedCount = 0;
    
    for (const note of customerNotes) {
      try {
        // Create blocks from the note content
        // For simplicity, we'll treat each note as a single block
        // In a more sophisticated system, you might split long notes into multiple blocks
        const blocks = splitNoteIntoBlocks(note.content);
        
        for (const blockContent of blocks) {
          // Generate embedding for the block
          const embedding = await generateEmbedding(blockContent);
          
          // Store the block with its embedding
          await prisma.block.create({
            data: {
              customer_note_id: note.id,
              content: blockContent,
              embedding: `[${embedding.join(',')}]` // Store as PostgreSQL array
            }
          });
          
          debug(`Created block for customer note ${note.id}: ${blockContent.substring(0, 50)}...`);
        }
        
        processedCount++;
        
        // Add a small delay to avoid hitting rate limits
        if (processedCount % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        debug(`Error processing customer note ${note.id}:`, error);
        // Continue with other notes even if one fails
      }
    }
    
    debug(`Completed embedding generation. Processed ${processedCount} notes.`);
    return processedCount;
    
  } catch (error) {
    debug('Error generating embeddings:', error);
    throw new Error(`Failed to generate embeddings: ${error.message}`);
  }
}

// Split note content into blocks (simple implementation)
function splitNoteIntoBlocks(content) {
  // For this demo, we'll keep it simple and use the entire note as one block
  // In a real application, you might want to split by sentences, paragraphs, or semantic chunks
  
  // Basic cleanup
  const cleanContent = content.trim();
  
  if (cleanContent.length === 0) {
    return [];
  }
  
  // If the content is very long (> 8000 chars), split it into smaller chunks
  const maxChunkSize = 8000;
  
  if (cleanContent.length <= maxChunkSize) {
    return [cleanContent];
  }
  
  // Simple splitting by sentences for long content
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const blocks = [];
  let currentBlock = '';
  
  for (const sentence of sentences) {
    const proposedBlock = currentBlock + sentence + '.';
    
    if (proposedBlock.length > maxChunkSize && currentBlock.length > 0) {
      blocks.push(currentBlock.trim());
      currentBlock = sentence + '.';
    } else {
      currentBlock = proposedBlock;
    }
  }
  
  if (currentBlock.trim().length > 0) {
    blocks.push(currentBlock.trim());
  }
  
  return blocks.length > 0 ? blocks : [cleanContent];
}

// Get embedding statistics
export async function getEmbeddingStats() {
  try {
    const totalNotes = await prisma.customerNote.count();
    const totalBlocks = await prisma.block.count();
    const notesWithEmbeddings = await prisma.customerNote.count({
      where: {
        blocks: {
          some: {}
        }
      }
    });
    
    return {
      totalCustomerNotes: totalNotes,
      totalBlocks: totalBlocks,
      notesWithEmbeddings: notesWithEmbeddings,
      notesWithoutEmbeddings: totalNotes - notesWithEmbeddings
    };
  } catch (error) {
    debug('Error getting embedding stats:', error);
    return null;
  }
}

// Re-generate embeddings for all customer notes (useful for testing)
export async function regenerateAllEmbeddings() {
  try {
    debug('Regenerating all embeddings...');
    
    // Delete existing blocks
    await prisma.block.deleteMany({});
    debug('Deleted existing blocks');
    
    // Generate new embeddings
    const processedCount = await generateEmbeddingsForCustomerNotes();
    
    debug(`Regenerated embeddings for ${processedCount} customer notes`);
    return processedCount;
  } catch (error) {
    debug('Error regenerating embeddings:', error);
    throw new Error(`Failed to regenerate embeddings: ${error.message}`);
  }
}

// Test embedding generation with a sample text
export async function testEmbeddingGeneration() {
  try {
    const sampleText = 'This is a test customer note about pricing concerns and implementation timeline.';
    const embedding = await generateEmbedding(sampleText);
    
    debug(`Test embedding generated successfully with ${embedding.length} dimensions`);
    return {
      success: true,
      dimensions: embedding.length,
      sampleValues: embedding.slice(0, 5) // First 5 values for verification
    };
  } catch (error) {
    debug('Error testing embedding generation:', error);
    return {
      success: false,
      error: error.message
    };
  }
} 