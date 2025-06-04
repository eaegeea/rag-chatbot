import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

// Initialize OpenAI client only if API key is available
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

const INDEX_NAME = 'rag-sales-chatbot';

let index = null;

// Initialize Pinecone index
export async function initializePinecone() {
  try {
    // Get existing indexes
    const existingIndexes = await pinecone.listIndexes();
    
    // Check if our index exists
    const indexExists = existingIndexes.indexes?.some(idx => idx.name === INDEX_NAME);
    
    if (!indexExists) {
      console.log(`Creating Pinecone index: ${INDEX_NAME}`);
      await pinecone.createIndex({
        name: INDEX_NAME,
        dimension: 1536, // OpenAI text-embedding-3-small dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      
      // Wait for index to be ready
      console.log('Waiting for index to be ready...');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    index = pinecone.index(INDEX_NAME);
    console.log(`✅ Pinecone index ready: ${INDEX_NAME}`);
    return index;
  } catch (error) {
    console.error('Error initializing Pinecone:', error);
    throw error;
  }
}

// Generate embedding using OpenAI
export async function generateEmbedding(text) {
  try {
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      encoding_format: 'float',
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Store embeddings in Pinecone
export async function storeEmbedding(id, embedding, metadata) {
  try {
    if (!index) {
      await initializePinecone();
    }
    
    await index.upsert([{
      id: String(id),
      values: embedding,
      metadata
    }]);
    
    console.log(`✅ Stored embedding for ID: ${id}`);
  } catch (error) {
    console.error('Error storing embedding:', error);
    throw error;
  }
}

// Store multiple embeddings
export async function storeEmbeddings(vectors) {
  try {
    if (!index) {
      await initializePinecone();
    }
    
    // Convert vectors to Pinecone format
    const pineconeVectors = vectors.map(vector => ({
      id: String(vector.id),
      values: vector.embedding,
      metadata: vector.metadata
    }));
    
    // Upsert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < pineconeVectors.length; i += batchSize) {
      const batch = pineconeVectors.slice(i, i + batchSize);
      await index.upsert(batch);
      console.log(`✅ Stored batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(pineconeVectors.length/batchSize)}`);
    }
    
    console.log(`✅ Stored ${vectors.length} embeddings in Pinecone`);
  } catch (error) {
    console.error('Error storing embeddings:', error);
    throw error;
  }
}

// Search for similar embeddings
export async function searchSimilar(queryEmbedding, options = {}) {
  try {
    if (!index) {
      await initializePinecone();
    }
    
    const {
      topK = 10,
      filter = {},
      includeMetadata = true,
      includeValues = false
    } = options;
    
    console.log(`🔍 Pinecone search with filter:`, JSON.stringify(filter, null, 2));
    console.log(`📊 Search parameters: topK=${topK}, includeMetadata=${includeMetadata}`);
    
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK,
      filter,
      includeMetadata,
      includeValues
    });
    
    console.log(`📋 Pinecone returned ${searchResults.matches?.length || 0} matches`);
    
    // Log each match for debugging
    searchResults.matches?.forEach((match, i) => {
      console.log(`  Match ${i + 1}: ID=${match.id}, Score=${match.score?.toFixed(3)}, ClientNoteID=${match.metadata?.client_note_id}, Client="${match.metadata?.client_name}"`);
    });
    
    return searchResults.matches || [];
  } catch (error) {
    console.error('Error searching embeddings:', error);
    throw error;
  }
}

// Delete embeddings by filter
export async function deleteEmbeddings(filter) {
  try {
    if (!index) {
      await initializePinecone();
    }
    
    await index.deleteMany(filter);
    console.log(`✅ Deleted embeddings with filter:`, filter);
  } catch (error) {
    console.error('Error deleting embeddings:', error);
    throw error;
  }
}

// Get index stats
export async function getIndexStats() {
  try {
    if (!index) {
      await initializePinecone();
    }
    
    const stats = await index.describeIndexStats();
    return stats;
  } catch (error) {
    console.error('Error getting index stats:', error);
    throw error;
  }
} 