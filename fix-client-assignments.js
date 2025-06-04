import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixClientAssignments() {
  try {
    console.log('🔧 Starting client note assignment fix...');
    
    // First, let's see what we have currently
    console.log('\n📊 Current client note assignments for notes 66-80:');
    const problematicNotes = await prisma.clientNote.findMany({
      where: {
        id: { gte: 66, lte: 80 }
      },
      include: {
        client: true
      },
      orderBy: { id: 'asc' }
    });
    
    problematicNotes.forEach(note => {
      console.log(`  Note ${note.id}: assigned to Client ${note.client_id} (${note.client?.name}) - "${note.content.substring(0, 50)}..."`);
    });
    
    // Check Lisa Garcia's actual client ID
    const lisaGarcia = await prisma.client.findFirst({
      where: { name: 'Lisa Garcia' }
    });
    
    if (!lisaGarcia) {
      throw new Error('Lisa Garcia client not found!');
    }
    
    console.log(`\n👤 Lisa Garcia is Client ID: ${lisaGarcia.id}`);
    console.log(`   Assigned to User ID: ${lisaGarcia.assigned_id}`);
    
    // Find notes that mention Lisa Garcia but are assigned to wrong client
    const lisaGarciaNotes = problematicNotes.filter(note => 
      note.content.toLowerCase().includes('lisa garcia') || 
      note.content.toLowerCase().includes('innovation labs')
    );
    
    console.log(`\n🔍 Found ${lisaGarciaNotes.length} notes mentioning Lisa Garcia:`);
    lisaGarciaNotes.forEach(note => {
      console.log(`  Note ${note.id}: Currently assigned to Client ${note.client_id} (${note.client?.name})`);
      console.log(`    Content: "${note.content.substring(0, 100)}..."`);
    });
    
    // Fix the assignments
    if (lisaGarciaNotes.length > 0) {
      console.log(`\n🔨 Fixing ${lisaGarciaNotes.length} note assignments...`);
      
      for (const note of lisaGarciaNotes) {
        const result = await prisma.clientNote.update({
          where: { id: note.id },
          data: { client_id: lisaGarcia.id },
          include: { client: true }
        });
        
        console.log(`  ✅ Fixed Note ${note.id}: ${note.client?.name} → ${result.client.name}`);
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verification - Lisa Garcia notes after fix:');
    const lisaNotesAfter = await prisma.clientNote.findMany({
      where: { client_id: lisaGarcia.id },
      include: { client: true },
      orderBy: { id: 'asc' }
    });
    
    lisaNotesAfter.forEach(note => {
      console.log(`  Note ${note.id}: "${note.content.substring(0, 60)}..."`);
    });
    
    // Check what notes each user should have access to
    console.log('\n📋 Client assignments summary:');
    const allClients = await prisma.client.findMany({
      include: {
        assigned_user: true,
        client_notes: {
          select: { id: true }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    allClients.forEach(client => {
      const noteIds = client.client_notes.map(n => n.id).sort((a, b) => a - b);
      console.log(`  Client ${client.id} (${client.name}) → User ${client.assigned_user?.name}: Notes [${noteIds.join(', ')}]`);
    });
    
    console.log('\n✅ Client assignment fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing client assignments:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixClientAssignments(); 