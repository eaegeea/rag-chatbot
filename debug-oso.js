import 'dotenv/config';
import { Oso } from 'oso-cloud';

const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

async function debugOso() {
  console.log('🔍 Debugging Oso Authorization...\n');
  
  try {
    console.log('📡 Testing Oso connection...');
    
    // Test a simple authorization call
    const testResult = await oso.authorize(
      { type: 'User', id: 'alice@company.com' },
      'view',
      { type: 'Client', id: '1' }
    );
    
    console.log('✅ Oso connection working!');
    console.log('Test result:', testResult);
    
    // Test with ClientNote
    console.log('\n🧪 Testing ClientNote authorization...');
    const noteResult = await oso.authorize(
      { type: 'User', id: 'alice@company.com' },
      'read',
      { type: 'ClientNote', id: '1' }
    );
    
    console.log('ClientNote result:', noteResult);
    
    // Test different action
    console.log('\n🧪 Testing different action...');
    const viewResult = await oso.authorize(
      { type: 'User', id: 'alice@company.com' },
      'view',
      { type: 'ClientNote', id: '1' }
    );
    
    console.log('View result:', viewResult);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugOso(); 