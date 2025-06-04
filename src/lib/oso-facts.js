import oso from './auth.js';
import prisma from './database.js';
import Debug from 'debug';

const debug = Debug('oso-facts');

// Load all facts into Oso Cloud
export async function loadFactsToOsoCloud() {
  try {
    debug('Loading facts into Oso Cloud...');
    
    // Clear existing facts first (optional)
    // await oso.delete('/api/facts');
    
    // Load organizations
    await loadOrganizations();
    
    // Load regions
    await loadRegions();
    
    // Load users
    await loadUsers();
    
    // Load clients
    await loadClients();
    
    // Load client notes
    await loadClientNotes();
    
    // Load blocks
    await loadBlocks();
    
    debug('All facts loaded successfully');
    return true;
  } catch (error) {
    debug('Error loading facts:', error);
    throw error;
  }
}

// Load organizations into Oso Cloud
async function loadOrganizations() {
  const organizations = await prisma.organization.findMany();
  
  for (const org of organizations) {
    await oso.tell({
      name: "has_relation",
      args: [
        { type: "Organization", id: org.id.toString() },
        "name",
        org.name
      ]
    });
    
    debug(`Loaded organization: ${org.name}`);
  }
}

// Load regions into Oso Cloud
async function loadRegions() {
  const regions = await prisma.region.findMany({
    include: { organization: true }
  });
  
  for (const region of regions) {
    // Region belongs to organization
    await oso.tell({
      name: "has_relation",
      args: [
        { type: "Region", id: region.id.toString() },
        "belongs_to",
        { type: "Organization", id: region.organization_id.toString() }
      ]
    });
    
    await oso.tell({
      name: "has_relation",
      args: [
        { type: "Region", id: region.id.toString() },
        "name",
        region.name
      ]
    });
    
    debug(`Loaded region: ${region.name}`);
  }
}

// Load users into Oso Cloud
async function loadUsers() {
  const users = await prisma.user.findMany({
    include: { 
      region: true,
      organization: true 
    }
  });
  
  for (const user of users) {
    // User belongs to organization with role-based relationship
    if (user.role === 'salesmanager') {
      await oso.tell({
        name: "has_relation",
        args: [
          { type: "User", id: user.email },
          "manager",
          { type: "Organization", id: user.organization_id.toString() }
        ]
      });
    } else {
      await oso.tell({
        name: "has_relation",
        args: [
          { type: "User", id: user.email },
          "user",
          { type: "Organization", id: user.organization_id.toString() }
        ]
      });
    }
    
    debug(`Loaded user: ${user.email} (${user.role}) in ${user.region.name}`);
  }
}

// Load clients into Oso Cloud
async function loadClients() {
  const clients = await prisma.client.findMany({
    include: {
      region: true,
      assigned: true
    }
  });
  
  for (const client of clients) {
    // Client has region relation
    await oso.tell({
      name: "has_relation",
      args: [
        { type: "Client", id: client.id.toString() },
        "region",
        { type: "Region", id: client.region_id.toString() }
      ]
    });
    
    // Client assigned to user (if exists)
    if (client.assigned) {
      await oso.tell({
        name: "has_relation",
        args: [
          { type: "Client", id: client.id.toString() },
          "assigned",
          { type: "User", id: client.assigned.email }
        ]
      });
    }
    
    debug(`Loaded client: ${client.name} (${client.company})`);
  }
}

// Load client notes into Oso Cloud
async function loadClientNotes() {
  const clientNotes = await prisma.clientNote.findMany({
    include: { client: true }
  });
  
  for (const note of clientNotes) {
    // Client note belongs to client
    await oso.tell({
      name: "has_relation",
      args: [
        { type: "ClientNote", id: note.id.toString() },
        "client",
        { type: "Client", id: note.client_id.toString() }
      ]
    });
    
    debug(`Loaded client note: ${note.id} for client ${note.client.name}`);
  }
}

// Load blocks into Oso Cloud
async function loadBlocks() {
  const blocks = await prisma.block.findMany({
    include: {
      client_note: {
        include: { client: true }
      }
    }
  });
  
  for (const block of blocks) {
    // Block belongs to client note
    await oso.tell({
      name: "has_relation",
      args: [
        { type: "Block", id: block.id.toString() },
        "client_note",
        { type: "ClientNote", id: block.client_note_id.toString() }
      ]
    });
    
    debug(`Loaded block: ${block.id} for note ${block.client_note_id}`);
  }
}

// Get facts summary
export async function getFactsSummary() {
  try {
    const organizations = await prisma.organization.count();
    const regions = await prisma.region.count();
    const users = await prisma.user.count();
    const clients = await prisma.client.count();
    const clientNotes = await prisma.clientNote.count();
    const blocks = await prisma.block.count();
    
    return {
      organizations,
      regions,
      users,
      clients,
      clientNotes,
      blocks
    };
  } catch (error) {
    debug('Error getting facts summary:', error);
    return null;
  }
}

// Test authorization with loaded facts
export async function testAuthorizationWithFacts() {
  try {
    debug('Testing authorization with loaded facts...');
    
    // Test cases updated for new structure
    const testCases = [
      {
        user: 'alice@company.com',
        client: '1', // John Peterson (Alice's client)
        expected: true
      },
      {
        user: 'alice@company.com', 
        client: '4', // Lisa Garcia (Bob's client)
        expected: false
      },
      {
        user: 'carol@company.com', // Sales manager
        client: '1', // East region client
        expected: true
      },
      {
        user: 'carol@company.com', // East sales manager
        client: '7', // West region client
        expected: false
      }
    ];
    
    const results = [];
    
    for (const testCase of testCases) {
      try {
        const result = await oso.authorize({
          actor: { type: 'User', id: testCase.user },
          action: 'view',
          resource: { type: 'Client', id: testCase.client }
        });
        
        const passed = result.allowed === testCase.expected;
        results.push({
          ...testCase,
          actual: result.allowed,
          passed
        });
        
        debug(`Test ${testCase.user} → Client:${testCase.client}: ${passed ? 'PASS' : 'FAIL'} (expected: ${testCase.expected}, actual: ${result.allowed})`);
      } catch (error) {
        debug(`Error testing ${testCase.user} → Client:${testCase.client}:`, error);
        results.push({
          ...testCase,
          actual: null,
          passed: false,
          error: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    debug('Error testing authorization:', error);
    throw error;
  }
} 