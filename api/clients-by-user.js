import { PrismaClient } from '@prisma/client';
import { Oso } from 'oso-cloud';

const prisma = new PrismaClient();
const oso = new Oso(
  process.env.OSO_CLOUD_URL || 'https://cloud.osohq.com',
  process.env.OSO_CLOUD_API_KEY
);

// Get authorized clients for a specific user using Oso Cloud buildQuery
async function getAuthorizedClientsForUser(userEmail) {
  try {
    console.log(`🔍 Getting authorized clients for ${userEmail}...`);
    
    // Try to use Oso's buildQuery functionality to get authorized client IDs directly
    try {
      // Import the typedVar function for Oso queries
      const { typedVar } = await import('oso-cloud');
      
      // Build a query to get authorized Client resources
      const actor = { type: 'User', id: userEmail };
      const clientVar = typedVar('Client');
      
      const sqlQuery = await oso
        .buildQuery(['allow', actor, 'view', clientVar])
        .evaluateLocalSelect({ client_id: clientVar });
      
      console.log(`✅ Generated Oso SQL query:`, sqlQuery);
      
      // Execute the SQL query against our database to get authorized client IDs
      const result = await prisma.$queryRawUnsafe(sqlQuery);
      console.log(`✅ Query result:`, result);
      
      // Extract client IDs from the result
      const authorizedClientIds = result.map(row => parseInt(row.client_id)).filter(id => !isNaN(id));
      
      if (authorizedClientIds.length === 0) {
        return [];
      }
      
      // Fetch only the authorized clients from the database
      const authorizedClients = await prisma.client.findMany({
        where: {
          id: { in: authorizedClientIds }
        },
        include: {
          assigned_user: true,
          region: true
        }
      });
      
      console.log(`✅ Retrieved ${authorizedClients.length} client records from database for ${userEmail}`);
      return authorizedClients;
      
    } catch (buildQueryError) {
      console.log('⚠️  Oso buildQuery method failed, falling back to individual authorization checks:', buildQueryError.message);
      
      // Fallback to the original approach if buildQuery method doesn't work
      const allClients = await prisma.client.findMany({
        include: {
          assigned_user: true,
          region: true
        }
      });
      
      if (allClients.length === 0) {
        return [];
      }
      
      console.log(`🔍 Checking access to ${allClients.length} clients individually for ${userEmail}...`);
      
      // Use Oso to check authorization for each client
      const authorizedClients = [];
      
      // Process in batches to avoid overwhelming Oso
      const batchSize = 10;
      for (let i = 0; i < allClients.length; i += batchSize) {
        const batch = allClients.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (client) => {
          try {
            const result = await oso.authorize(
              { type: 'User', id: userEmail },
              'view',
              { type: 'Client', id: client.id.toString() }
            );
            
            // Add detailed logging to debug authorization
            console.log(`🔐 Authorization check: ${userEmail} -> Client ${client.id} (${client.name}): ${result ? '✅ ALLOWED' : '❌ DENIED'}`);
            
            return result ? client : null;
          } catch (authError) {
            console.error(`Authorization check failed for client ${client.id}:`, authError);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        authorizedClients.push(...batchResults.filter(client => client !== null));
      }
      
      console.log(`✅ User ${userEmail} has access to ${authorizedClients.length} clients (fallback method)`);
      return authorizedClients;
    }
    
  } catch (error) {
    console.error('Error getting authorized clients:', error);
    return [];
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userEmail } = req.body;

    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    // Validate that the user exists
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { region: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get authorized clients for the specified user
    const authorizedClients = await getAuthorizedClientsForUser(userEmail);

    // Format the response with user context
    const response = {
      user: {
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region?.name || 'Unknown Region'
      },
      clients: authorizedClients.map(client => ({
        id: client.id,
        name: client.name,
        company: client.company,
        region: client.region?.name || 'Unknown Region',
        assignedUser: client.assigned_user ? {
          name: client.assigned_user.name,
          email: client.assigned_user.email
        } : null
      })),
      totalClients: authorizedClients.length
    };

    return res.status(200).json(response);

  } catch (error) {
    console.error('Error in clients-by-user API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
} 