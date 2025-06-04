import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database contents...');
    
    const clients = await prisma.client.findMany({
      include: {
        assigned_user: true,
        client_notes: {
          select: { id: true, note_type: true, content: true }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log(`\n📊 Found ${clients.length} clients:`);
    clients.forEach(client => {
      console.log(`  Client ${client.id}: ${client.name} (${client.company}) → ${client.assigned_user?.name}`);
      console.log(`    Notes: ${client.client_notes.length} total`);
      if (client.client_notes.length > 0) {
        const noteIds = client.client_notes.map(n => n.id).sort((a, b) => a - b);
        console.log(`    Note IDs: [${noteIds.join(', ')}]`);
      }
    });
    
    // Check for problem notes mentioning other clients
    console.log('\n🔍 Checking for cross-referenced notes...');
    const allNotes = await prisma.clientNote.findMany({
      include: { client: true },
      orderBy: { id: 'asc' }
    });
    
    const problemNotes = [];
    allNotes.forEach(note => {
      const content = note.content.toLowerCase();
      const assignedClientName = note.client.name.toLowerCase();
      
      // Check if note mentions a different client
      clients.forEach(client => {
        const clientName = client.name.toLowerCase();
        if (clientName !== assignedClientName && content.includes(clientName)) {
          problemNotes.push({
            noteId: note.id,
            assignedTo: note.client.name,
            mentions: client.name,
            content: note.content.substring(0, 100) + '...'
          });
        }
      });
    });
    
    if (problemNotes.length > 0) {
      console.log(`\n⚠️  Found ${problemNotes.length} problematic notes:`);
      problemNotes.forEach(problem => {
        console.log(`  Note ${problem.noteId}: Assigned to "${problem.assignedTo}" but mentions "${problem.mentions}"`);
        console.log(`    Content: "${problem.content}"`);
      });
    } else {
      console.log('\n✅ No cross-referenced notes found!');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 