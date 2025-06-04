// Simple test script to verify Oso Cloud authorization
// Run with: node test-oso.js (after installing Node.js)

import 'dotenv/config';
import { Oso } from 'oso-cloud';

const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

async function testAuthorization() {
  console.log('🧪 Testing Oso Cloud Authorization...\n');
  
  const testCases = [
    {
      name: 'Alice (salesperson) can view her assigned client',
      actor: { type: 'User', id: 'alice@company.com' },
      action: 'view',
      resource: { type: 'Client', id: '1' },
      expected: true
    },
    {
      name: 'Alice (salesperson) cannot view Bob\'s client',
      actor: { type: 'User', id: 'alice@company.com' },
      action: 'view',
      resource: { type: 'Client', id: '4' },
      expected: false
    },
    {
      name: 'Carol (sales manager) can view any East region client',
      actor: { type: 'User', id: 'carol@company.com' },
      action: 'view',
      resource: { type: 'Client', id: '1' },
      expected: true
    },
    {
      name: 'Carol (East manager) cannot view West region client',
      actor: { type: 'User', id: 'carol@company.com' },
      action: 'view',
      resource: { type: 'Client', id: '7' },
      expected: false
    },
    {
      name: 'Frank (West manager) can view West region client',
      actor: { type: 'User', id: 'frank@company.com' },
      action: 'view',
      resource: { type: 'Client', id: '7' },
      expected: true
    }
  ];
  
  let passed = 0;
  let total = testCases.length;
  
  for (const test of testCases) {
    try {
      console.log(`Testing: ${test.name}`);
      
      const result = await oso.authorize(test.actor, test.action, test.resource);
      
      const success = result === test.expected;
      console.log(`  Expected: ${test.expected}, Got: ${result} ${success ? '✅' : '❌'}`);
      
      if (success) passed++;
      
    } catch (error) {
      console.log(`  Error: ${error.message} ❌`);
    }
    console.log('');
  }
  
  console.log(`\n📊 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All authorization tests passed! Your setup is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check your Oso Cloud policy and facts.');
  }
}

// Run the test
testAuthorization().catch(console.error); 