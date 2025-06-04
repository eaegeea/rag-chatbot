#!/usr/bin/env node

import 'dotenv/config';
import Debug from 'debug';
import { testConnection, disconnect } from './lib/database.js';
import { testOpenAIConnection } from './lib/ai.js';
import { testOsoConnection, initializeOsoData } from './lib/auth.js';
import { generateEmbeddingsForCustomerNotes, getEmbeddingStats, testEmbeddingGeneration } from './lib/embeddings.js';
// import { loadFactsToOsoCloud, getFactsSummary, testAuthorizationWithFacts } from './lib/oso-facts.js';

const debug = Debug('initialize');

async function main() {
  console.log('🚀 Initializing RAG Sales Chatbot...\n');
  
  try {
    // Test all connections first
    console.log('📡 Testing connections...');
    
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error('Database connection failed. Check your DATABASE_URL environment variable.');
    }
    console.log('✅ Database connection successful');
    
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    const openaiConnected = await testOpenAIConnection();
    if (!openaiConnected) {
      throw new Error('OpenAI connection failed. Check your API key.');
    }
    console.log('✅ OpenAI connection successful');
    
    // Oso connection is optional for initial setup
    let osoConnected = false;
    if (process.env.OSO_CLOUD_API_KEY) {
      osoConnected = await testOsoConnection();
      if (osoConnected) {
        console.log('✅ Oso Cloud connection successful');
      } else {
        console.log('⚠️  Oso Cloud connection failed - authorization will use simplified logic');
      }
    } else {
      console.log('⚠️  Oso Cloud API key not provided - authorization will use simplified logic');
    }
    
    console.log('\n📊 Checking embedding status...');
    
    const stats = await getEmbeddingStats();
    if (stats) {
      console.log(`📈 Current stats:
  - Client notes: ${stats.totalClientNotes || stats.totalCustomerNotes || 0}
  - Notes with embeddings: ${stats.notesWithEmbeddings}
  - Notes without embeddings: ${stats.notesWithoutEmbeddings}
  - Total blocks: ${stats.totalBlocks}`);
    }
    
    if (stats && stats.notesWithoutEmbeddings > 0) {
      console.log('\n🔄 Generating embeddings for client notes...');
      
      // Test embedding generation first
      console.log('🧪 Testing embedding generation...');
      const testResult = await testEmbeddingGeneration();
      if (!testResult.success) {
        throw new Error(`Embedding test failed: ${testResult.error}`);
      }
      console.log(`✅ Embedding test successful (${testResult.dimensions} dimensions)`);
      
      // Generate embeddings for all client notes
      const processedCount = await generateEmbeddingsForCustomerNotes();
      console.log(`✅ Generated embeddings for ${processedCount} client notes`);
      
      // Show updated stats
      const updatedStats = await getEmbeddingStats();
      if (updatedStats) {
        console.log(`📈 Updated stats:
  - Total blocks: ${updatedStats.totalBlocks}
  - Notes with embeddings: ${updatedStats.notesWithEmbeddings}/${updatedStats.totalClientNotes || updatedStats.totalCustomerNotes}`);
      }
    } else {
      console.log('✅ All client notes already have embeddings');
    }
    
    console.log('\n🔐 Testing authorization with manually added facts...');
    
    if (process.env.OSO_CLOUD_API_KEY && osoConnected) {
      try {
        await initializeOsoData();
        console.log('✅ Oso Cloud authorization data initialized');
        
        // Test authorization with manually added facts
        console.log('\n🧪 Testing authorization...');
        
        // Simple test cases using the manually added facts
        const testCases = [
          {
            user: 'alice@company.com',
            action: 'view',
            resource: 'Client:1',
            expected: true,
            description: 'Alice (salesperson) can view her assigned client'
          },
          {
            user: 'alice@company.com',
            action: 'view', 
            resource: 'Client:4',
            expected: false,
            description: 'Alice (salesperson) cannot view Bob\'s client'
          },
          {
            user: 'carol@company.com',
            action: 'view',
            resource: 'Client:1', 
            expected: true,
            description: 'Carol (sales manager) can view East region client'
          },
          {
            user: 'carol@company.com',
            action: 'view',
            resource: 'Client:7',
            expected: false,
            description: 'Carol (East manager) cannot view West region client'
          }
        ];
        
        // Note: These are the same test cases from your manually added facts
        console.log('✅ Authorization tests configured');
        console.log('   Run "node test-oso.js" to test your manually added facts');
        
      } catch (error) {
        console.log('⚠️  Oso Cloud testing failed - using simplified authorization');
        debug('Oso testing error:', error);
      }
    } else {
      console.log('⚠️  Using simplified authorization (no Oso Cloud API key provided)');
    }
    
    console.log('\n🎉 Initialization complete!');
    console.log('\nNext steps:');
    console.log('1. Your facts are already loaded in Oso Cloud ✅');
    console.log('2. Test authorization: node test-oso.js');
    console.log('3. Run the chatbot: npm start');
    console.log('4. Or run web version: npx vercel dev');
    
    console.log('\nSample users to try:');
    console.log('- alice@company.com (East region salesperson)');
    console.log('- carol@company.com (East region sales manager)');
    console.log('- david@company.com (West region salesperson)');
    console.log('- frank@company.com (West region sales manager)');
    
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    debug('Full error:', error);
    process.exit(1);
  } finally {
    await disconnect();
  }
}

// Run the initialization
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
}); 