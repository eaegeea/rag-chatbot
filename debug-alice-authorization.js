import { PrismaClient } from '@prisma/client';
import { Oso } from 'oso-cloud';

const prisma = new PrismaClient();
const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

async function debugAliceAuthorization() {
  try {
    console.log('🔍 Debugging Alice\'s Authorization...\n');
    
    const userEmail = 'alice@company.com';
    
    // Step 1: Get Alice's profile
    const alice = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        region: true,
        assigned_clients: {
          include: {
            client_notes: { select: { id: true } }
          }
        }
      }
    });
    
    console.log(`👤 Alice Profile:`);
    console.log(`   Email: ${alice.email}`);
    console.log(`   Role: ${alice.role}`);
    console.log(`   Region: ${alice.region.name}`);
    console.log(`   Assigned Clients: ${alice.assigned_clients.length}`);
    
    console.log(`\n📋 Alice's Assigned Clients:`);
    alice.assigned_clients.forEach(client => {
      const noteIds = client.client_notes.map(n => n.id).sort((a, b) => a - b);
      console.log(`   • Client ${client.id}: ${client.name} (${client.company})`);
      console.log(`     Note IDs: [${noteIds.join(', ')}]`);
    });
    
    // Step 2: Get ALL clients to test authorization
    const allClients = await prisma.client.findMany({
      include: {
        assigned_user: true,
        client_notes: { 
          select: { id: true, content: true },
          orderBy: { id: 'asc' }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`\n🔐 Testing Authorization for All Clients:`);
    const authorizedClientIds = [];
    
    for (const client of allClients) {
      try {
        const result = await oso.authorize(
          { type: 'User', id: userEmail },
          'view',
          { type: 'Client', id: client.id.toString() }
        );
        
        const status = result ? '✅ ALLOWED' : '❌ DENIED';
        console.log(`   Client ${client.id} (${client.name}): ${status} → ${client.assigned_user?.name}`);
        
        if (result) {
          authorizedClientIds.push(client.id);
        }
      } catch (error) {
        console.log(`   Client ${client.id}: ⚠️  ERROR - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Alice is authorized to see ${authorizedClientIds.length} clients: [${authorizedClientIds.join(', ')}]`);
    
    // Step 3: Get all client notes Alice should have access to
    const authorizedNotes = await prisma.clientNote.findMany({
      where: {
        client_id: { in: authorizedClientIds }
      },
      include: {
        client: true
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`\n📝 Alice's Authorized Client Notes (${authorizedNotes.length} total):`);
    authorizedNotes.forEach(note => {
      const clientInfo = `${note.client.name} (${note.client.company})`;
      const contentPreview = note.content.substring(0, 60) + '...';
      console.log(`   Note ${note.id} → Client ${note.client_id} (${clientInfo}): "${contentPreview}"`);
    });
    
    // Step 4: Check specifically for Lisa Garcia mentions
    console.log(`\n🔍 Checking for Lisa Garcia Content in Alice's Authorized Notes:`);
    const lisaGarciaMentions = authorizedNotes.filter(note => 
      note.content.toLowerCase().includes('lisa garcia') ||
      note.content.toLowerCase().includes('innovation labs')
    );
    
    if (lisaGarciaMentions.length > 0) {
      console.log(`🚨 SECURITY BREACH: Found ${lisaGarciaMentions.length} notes mentioning Lisa Garcia in Alice's authorized list:`);
      lisaGarciaMentions.forEach(note => {
        console.log(`   ❌ Note ${note.id} → Client ${note.client_id} (${note.client.name})`);
        console.log(`      Content: "${note.content}"`);
      });
    } else {
      console.log(`✅ No Lisa Garcia content found in Alice's authorized notes`);
    }
    
    // Step 5: Check Lisa Garcia's actual client assignment
    console.log(`\n👤 Lisa Garcia's Actual Assignment:`);
    const lisaClient = await prisma.client.findFirst({
      where: { name: 'Lisa Garcia' },
      include: {
        assigned_user: true,
        client_notes: {
          select: { id: true },
          orderBy: { id: 'asc' }
        }
      }
    });
    
    if (lisaClient) {
      console.log(`   Client ${lisaClient.id}: ${lisaClient.name} (${lisaClient.company})`);
      console.log(`   Assigned to: ${lisaClient.assigned_user?.name} (${lisaClient.assigned_user?.email})`);
      console.log(`   Note IDs: [${lisaClient.client_notes.map(n => n.id).join(', ')}]`);
      
      // Check if Alice is authorized to see Lisa's client
      const lisaClientAuth = await oso.authorize(
        { type: 'User', id: userEmail },
        'view',
        { type: 'Client', id: lisaClient.id.toString() }
      );
      
      console.log(`   Alice's access to Lisa's client: ${lisaClientAuth ? '✅ ALLOWED' : '❌ DENIED'}`);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAliceAuthorization(); 