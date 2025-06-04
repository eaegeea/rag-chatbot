import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mock Oso client that simulates authorization logic
class MockOso {
  async authorize(actor, action, resource) {
    // Simulate the authorization logic based on our policy
    const userEmail = actor.id;
    const resourceType = resource.type;
    const resourceId = parseInt(resource.id);
    
    if (resourceType === 'ClientNote') {
      // Get the user and their assigned clients
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        include: {
          region: true,
          assigned_clients: {
            include: {
              client_notes: true
            }
          }
        }
      });
      
      if (!user) return { allowed: false };
      
      if (user.role === 'salesperson') {
        // Salespeople can only read notes from their assigned clients
        const allowedNoteIds = user.assigned_clients.flatMap(client => 
          client.client_notes.map(note => note.id)
        );
        return { allowed: allowedNoteIds.includes(resourceId) };
      } else if (user.role === 'salesmanager') {
        // Sales managers can read all notes in their region
        const regionClients = await prisma.client.findMany({
          where: { region_id: user.region_id },
          include: { client_notes: true }
        });
        
        const allowedNoteIds = regionClients.flatMap(client => 
          client.client_notes.map(note => note.id)
        );
        return { allowed: allowedNoteIds.includes(resourceId) };
      }
    }
    
    return { allowed: false };
  }
}

const mockOso = new MockOso();

async function testAuthorizationFlow() {
  console.log('🧪 Testing Authorization Flow (Mock Oso)...\n');
  
  try {
    // Test user
    const userEmail = 'alice@company.com';
    
    // Get user info
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        region: true,
        assigned_clients: {
          include: {
            client_notes: true
          }
        }
      }
    });
    
    console.log(`👤 User: ${user.name} (${user.email})`);
    console.log(`🏢 Region: ${user.region.name}`);
    console.log(`👔 Role: ${user.role}`);
    console.log(`📊 Assigned Clients: ${user.assigned_clients.length}`);
    
    // List assigned clients and their notes
    console.log('\n📋 Assigned Clients:');
    for (const client of user.assigned_clients) {
      console.log(`  • ${client.name} (${client.company}) - ${client.client_notes.length} notes`);
    }
    
    // Get all client notes in database
    const allClientNotes = await prisma.clientNote.findMany({
      select: { id: true, content: true, client_id: true },
      take: 10 // Test with first 10
    });
    
    console.log(`\n🗂️  Total client notes in DB: ${allClientNotes.length}`);
    
    // Test authorization for each note
    console.log('\n🔐 Testing authorization for each note:');
    let allowedCount = 0;
    
    for (const note of allClientNotes) {
      try {
        const result = await mockOso.authorize(
          { type: 'User', id: userEmail },
          'read',
          { type: 'ClientNote', id: note.id.toString() }
        );
        
        const status = result.allowed ? '✅ ALLOWED' : '❌ DENIED';
        if (result.allowed) allowedCount++;
        
        console.log(`  Note ${note.id} (Client ${note.client_id}): ${status} - "${note.content.substring(0, 50)}..."`);
      } catch (error) {
        console.log(`  Note ${note.id}: ⚠️  ERROR - ${error.message}`);
      }
    }
    
    console.log(`\n📊 Summary: Alice can access ${allowedCount}/${allClientNotes.length} notes`);
    
    // Test with a sales manager
    console.log('\n🧪 Testing with Sales Manager (Carol)...');
    const managerEmail = 'carol@company.com';
    
    const manager = await prisma.user.findUnique({
      where: { email: managerEmail },
      include: { region: true }
    });
    
    console.log(`👤 Manager: ${manager.name} (${manager.email}) - ${manager.role} in ${manager.region.name}`);
    
    let managerAllowedCount = 0;
    for (const note of allClientNotes.slice(0, 5)) { // Test first 5 notes
      const result = await mockOso.authorize(
        { type: 'User', id: managerEmail },
        'read',
        { type: 'ClientNote', id: note.id.toString() }
      );
      
      const status = result.allowed ? '✅ ALLOWED' : '❌ DENIED';
      if (result.allowed) managerAllowedCount++;
      
      console.log(`  Note ${note.id}: ${status}`);
    }
    
    console.log(`\n📊 Summary: Carol can access ${managerAllowedCount}/5 tested notes`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthorizationFlow(); 