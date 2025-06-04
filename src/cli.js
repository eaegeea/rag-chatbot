#!/usr/bin/env node

import 'dotenv/config';
import { Command } from 'commander';
import Debug from 'debug';
import { createInterface } from 'readline';
import { getUserByEmail, getAllUsers, disconnect } from './lib/database.js';
import { generateEmbedding, generateChatbotResponse } from './lib/ai.js';
import { getAuthorizedBlocks } from './lib/auth.js';

const debug = Debug('main');

// Create CLI interface
const program = new Command();

program
  .name('rag-sales-chatbot')
  .description('RAG chatbot with fine-grained authorization for sales teams')
  .version('1.0.0');

program
  .command('chat')
  .description('Start an interactive chat session')
  .action(startChatSession);

program
  .command('list-users')
  .description('List all available users')
  .action(listUsers);

// Default action is to start chat
if (process.argv.length === 2) {
  startChatSession();
} else {
  program.parse();
}

async function startChatSession() {
  console.log('🤖 Welcome to the RAG Sales Chatbot!');
  console.log('This chatbot provides information from customer notes with fine-grained authorization.\n');

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    // Get user selection
    const user = await selectUser(rl);
    if (!user) {
      console.log('👋 Goodbye!');
      return;
    }

    console.log(`\n👋 Hello, ${user.name}!`);
    console.log(`🏢 Region: ${user.region.name}`);
    console.log(`👔 Role: ${user.role}`);
    
    if (user.role === 'salesperson') {
      console.log(`�� You have access to your assigned clients`);
    } else if (user.role === 'salesmanager') {
      console.log(`📊 You can see all clients in the ${user.region.name} region`);
    }
    
    console.log('\n💡 Try asking questions like:');
    console.log('  - "What are the main customer concerns?"');
    console.log('  - "Show me information about pricing discussions"');
    console.log('  - "What feedback have we received about our product?"');
    console.log('  - "Are there any integration issues mentioned?"');
    console.log('\nType "exit" to quit.\n');

    // Start chat loop
    await chatLoop(rl, user);

  } catch (error) {
    console.error('Error:', error.message);
    debug('Full error:', error);
  } finally {
    rl.close();
    await disconnect();
  }
}

async function selectUser(rl) {
  console.log('📋 Available users:');
  
  const users = await getAllUsers();
  
  // Group users by region for better display
  const usersByRegion = users.reduce((acc, user) => {
    if (!acc[user.region.name]) {
      acc[user.region.name] = [];
    }
    acc[user.region.name].push(user);
    return acc;
  }, {});

  let index = 1;
  const userList = [];
  
  Object.entries(usersByRegion).forEach(([regionName, regionUsers]) => {
    console.log(`\n🏢 ${regionName} Region:`);
    regionUsers.forEach(user => {
      console.log(`  ${index}. ${user.name} (${user.email}) - ${user.role}`);
      userList.push(user);
      index++;
    });
  });

  const answer = await askQuestion(rl, '\n👤 Select a user (number) or type "exit": ');
  
  if (answer.toLowerCase() === 'exit') {
    return null;
  }

  const userIndex = parseInt(answer) - 1;
  if (userIndex >= 0 && userIndex < userList.length) {
    return userList[userIndex];
  } else {
    console.log('❌ Invalid selection. Please try again.');
    return await selectUser(rl);
  }
}

async function chatLoop(rl, user) {
  while (true) {
    const question = await askQuestion(rl, '💬 Ask me anything: ');
    
    if (question.toLowerCase() === 'exit') {
      console.log('👋 Goodbye!');
      break;
    }

    if (question.trim() === '') {
      continue;
    }

    try {
      console.log('🔍 Searching for relevant information...');
      
      // Generate embedding for the user's question
      const questionEmbedding = await generateEmbedding(question);
      debug('Generated question embedding');

      // Get authorized blocks based on user's permissions
      const authorizedBlocks = await getAuthorizedBlocks(user.email, questionEmbedding, 0.3);
      debug(`Found ${authorizedBlocks.length} authorized blocks`);

      if (debug.enabled) {
        console.log('\n🔍 Relevant context found:');
        authorizedBlocks.forEach((block, index) => {
          console.log(`  ${index + 1}. (Similarity: ${block.similarity?.toFixed(3) || 'N/A'}) ${block.content.substring(0, 100)}...`);
        });
        console.log();
      }

      // Generate response using the authorized context
      console.log('🤔 Generating response...');
      const response = await generateChatbotResponse(question, authorizedBlocks);

      console.log('\n🤖 Assistant:');
      console.log(response);
      console.log();

    } catch (error) {
      console.error('❌ Error processing your question:', error.message);
      debug('Full error:', error);
    }
  }
}

async function listUsers() {
  try {
    console.log('📋 All Users:\n');
    
    const users = await getAllUsers();
    
    const usersByRegion = users.reduce((acc, user) => {
      if (!acc[user.region.name]) {
        acc[user.region.name] = [];
      }
      acc[user.region.name].push(user);
      return acc;
    }, {});

    Object.entries(usersByRegion).forEach(([regionName, regionUsers]) => {
      console.log(`🏢 ${regionName} Region:`);
      regionUsers.forEach(user => {
        console.log(`  • ${user.name} (${user.email})`);
        console.log(`    Role: ${user.role}`);
        if (user.role === 'salesperson') {
          // Note: customers relationship might not be loaded in getAllUsers
          console.log(`    Access: Own assigned customers`);
        } else if (user.role === 'sales_manager') {
          console.log(`    Access: All customers in ${regionName} region`);
        }
        console.log();
      });
    });
    
  } catch (error) {
    console.error('Error listing users:', error.message);
    debug('Full error:', error);
  } finally {
    await disconnect();
  }
}

// Helper function to ask questions with readline
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Handle process termination gracefully
process.on('SIGINT', async () => {
  console.log('\n👋 Goodbye!');
  await disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
}); 