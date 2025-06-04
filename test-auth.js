import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Oso } from 'oso-cloud';

const prisma = new PrismaClient();
const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

async function testAuthorizationFlow() {
  console.log('🧪 Testing Authorization Flow...\n');
  
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
      include: {
        client: {
          select: { name: true, company: true }
        }
      },
      take: 10 // Test with first 10
    });
    
    console.log(`\n🗂️  Total client notes in DB: ${allClientNotes.length}`);
    
    // Show which clients these notes belong to
    console.log('\n📋 Client notes breakdown:');
    for (const note of allClientNotes) {
      console.log(`  Note ${note.id} → Client ${note.client_id} (${note.client.name} - ${note.client.company})`);
    }
    
    // Test authorization for each note
    console.log('\n🔐 Testing authorization for each note:');
    let allowedCount = 0;
    
    for (const note of allClientNotes) {
      try {
        // First test direct client access
        const clientResult = await oso.authorize(
          { type: 'User', id: userEmail },
          'view',
          { type: 'Client', id: note.client_id.toString() }
        );
        
        // Use our hybrid approach: if user can access client, they can access the note
        const noteAllowed = clientResult; // Simple: client access = note access
        
        const status = noteAllowed ? '✅ ALLOWED' : '❌ DENIED';
        if (noteAllowed) allowedCount++;
        
        console.log(`  Note ${note.id} (Client ${note.client_id}): Client=${clientResult} | Note=${status} - "${note.content.substring(0, 50)}..."`);
      } catch (error) {
        console.log(`  Note ${note.id}: ⚠️  ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthorizationFlow(); 