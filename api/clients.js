import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get CEO information
    const ceo = await prisma.user.findFirst({
      where: {
        role: 'ceo'
      }
    });

    // Get all regions with their managers, clients, and assigned salespeople
    const regions = await prisma.region.findMany({
      include: {
        users: {
          where: {
            role: 'salesmanager'
          }
        },
        clients: {
          include: {
            assigned_user: true
          },
          orderBy: {
            name: 'asc'
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format the response
    const formattedRegions = regions.map(region => ({
      id: region.id,
      name: region.name,
      manager: region.users[0] || null, // Should be one manager per region
      clients: region.clients.map(client => ({
        id: client.id,
        name: client.name,
        company: client.company,
        assigned_salesperson: client.assigned_user
      }))
    }));

    return res.status(200).json({
      ceo: ceo,
      regions: formattedRegions
    });

  } catch (error) {
    console.error('Clients API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
} 