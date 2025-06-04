import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNoteAssignments() {
  try {
    console.log('🔍 Checking note assignments for IDs 66-80...\n');
    
    const notes = await prisma.clientNote.findMany({
      where: {
        id: { gte: 66, lte: 80 }
      },
      include: {
        client: true
      },
      orderBy: { id: 'asc' }
    });
    
    notes.forEach(note => {
      console.log(`Note ${note.id}: assigned to Client ${note.client_id} (${note.client.name}) - "${note.content.substring(0, 60)}..."`);
    });
    
    console.log('\n🔍 According to the additional notes template, these should be:');
    console.log('Note IDs 66-80: Should belong to Client 4 (Lisa Garcia)');
    console.log('But Alice (authorized for Clients 1,2,3) is getting these note IDs!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNoteAssignments(); 