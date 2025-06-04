import { PrismaClient } from '@prisma/client';
import { generateEmbedding, storeEmbeddings } from './lib/pinecone.js';

const prisma = new PrismaClient();

// Enhanced client note templates with company names
const noteTemplates = [
  { type: 'meeting', template: (clientName, company) => `Meeting with ${clientName} from ${company}: Discussed Q4 budget allocation of $150K for software modernization. They're particularly interested in cloud migration capabilities and want to see ROI projections within 18 months.` },
  
  { type: 'concern', template: (clientName, company) => `${company}'s ${clientName} raised concerns about data security compliance. They need GDPR and SOC2 certifications before proceeding. Scheduled security audit review for next week.` },
  
  { type: 'call', template: (clientName, company) => `Follow-up call with ${clientName} at ${company}: Competitor analysis shows our pricing is 15% higher than market average. They're willing to consider premium pricing if we can demonstrate superior integration capabilities.` },
  
  { type: 'meeting', template: (clientName, company) => `${clientName} from ${company} requested demo of dashboard analytics features. Their current system lacks real-time reporting. Emphasized our machine learning insights and predictive analytics capabilities.` },
  
  { type: 'call', template: (clientName, company) => `Technical discussion with ${company}'s ${clientName}: Legacy system integration will require custom API development. Estimated 6-8 weeks for full implementation. They approved additional consulting hours.` },
  
  { type: 'concern', template: (clientName, company) => `${clientName} at ${company} mentioned team resistance to change. Recommended comprehensive training program and change management support. They're concerned about user adoption rates.` },
  
  { type: 'pricing', template: (clientName, company) => `Contract negotiation with ${company}: ${clientName} wants performance guarantees with 99.9% uptime SLA. Discussed penalty clauses and service credits for downtime incidents.` },
  
  { type: 'meeting', template: (clientName, company) => `${clientName} from ${company} loves the mobile app functionality. Their field teams need offline capabilities for remote locations. This is a key differentiator from competitors.` },
  
  { type: 'meeting', template: (clientName, company) => `Meeting notes: ${company}'s ${clientName} discussed scaling requirements. They expect 300% user growth over next 2 years. Need to ensure our infrastructure can handle increased load.` },
  
  { type: 'call', template: (clientName, company) => `${clientName} at ${company} requested custom reporting features for executive dashboard. They need industry-specific KPIs and benchmarking against sector averages.` },
  
  { type: 'pricing', template: (clientName, company) => `Pricing discussion with ${company}: ${clientName} negotiating volume discount for multi-year contract. Proposed 20% savings for 3-year commitment with automatic renewals.` },
  
  { type: 'call', template: (clientName, company) => `${clientName} from ${company} praised our customer support responsiveness. They experienced critical issue last month and our 2-hour resolution time exceeded expectations. Strong reference potential.` },
  
  { type: 'meeting', template: (clientName, company) => `Integration planning session: ${company}'s ${clientName} outlined their current tech stack. We'll need connectors for Salesforce, SAP, and their custom ERP system. Complex but manageable.` },
  
  { type: 'concern', template: (clientName, company) => `${clientName} at ${company} concerned about vendor lock-in. Discussed data export capabilities and API documentation. Assured them of data portability and open standards compliance.` },
  
  { type: 'call', template: (clientName, company) => `Feature request from ${company}: ${clientName} wants advanced workflow automation. Their current manual processes take 40+ hours per week. Our solution could save 60% of that time.` },
  
  { type: 'meeting', template: (clientName, company) => `${clientName} from ${company} shared feedback from pilot program. Initial user satisfaction scores at 4.2/5. Main complaints about learning curve, but overall positive reception.` },
  
  { type: 'pricing', template: (clientName, company) => `Budget review with ${company}'s ${clientName}: They have additional $75K available if we can accelerate implementation timeline. Discussed resource allocation and project prioritization.` },
  
  { type: 'concern', template: (clientName, company) => `${clientName} at ${company} mentioned compliance audit upcoming in Q1. Our platform needs to pass their internal security review. Provided security documentation and compliance certificates.` },
  
  { type: 'call', template: (clientName, company) => `Competitive analysis discussion: ${company}'s ${clientName} comparing us against two other vendors. Our main advantages are ease of use and comprehensive reporting capabilities.` },
  
  { type: 'pricing', template: (clientName, company) => `${clientName} from ${company} requested ROI calculator for executive presentation. They need to justify $200K+ investment to board of directors. Prepared detailed cost-benefit analysis.` }
];

async function generateAdditionalEmbeddings() {
  try {
    console.log('🚀 Starting generation of additional client embeddings...');
    
    // Get all clients
    const clients = await prisma.client.findMany({
      include: {
        assigned_user: true
      }
    });
    
    console.log(`📋 Found ${clients.length} clients`);
    
    let totalEmbeddings = 0;
    const batchSize = 10; // Process in smaller batches to avoid rate limits
    
    for (const client of clients) {
      console.log(`\n📝 Generating notes for ${client.name} at ${client.company}...`);
      
      const clientNotes = [];
      const embeddings = [];
      
      // Generate 15 notes for this client
      for (let i = 0; i < 15; i++) {
        const templateIndex = i % noteTemplates.length;
        const noteContent = noteTemplates[templateIndex].template(client.name, client.company);
        
        // Create client note in database
        const clientNote = await prisma.clientNote.create({
          data: {
            client_id: client.id,
            content: noteContent,
            note_type: noteTemplates[templateIndex].type
          }
        });
        
        clientNotes.push(clientNote);
        
        // Generate embedding
        console.log(`  📊 Generating embedding ${i + 1}/15...`);
        const embedding = await generateEmbedding(noteContent);
        
        embeddings.push({
          id: `client_note_${clientNote.id}`,
          embedding: embedding,
          metadata: {
            client_note_id: clientNote.id,
            client_id: client.id,
            client_name: client.name,
            company: client.company,
            content: noteContent,
            assigned_user_id: client.assigned_user_id,
            note_type: noteTemplates[templateIndex].type
          }
        });
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Upload embeddings to Pinecone in batches
      console.log(`  🔄 Uploading ${embeddings.length} embeddings to Pinecone...`);
      for (let i = 0; i < embeddings.length; i += batchSize) {
        const batch = embeddings.slice(i, i + batchSize);
        await storeEmbeddings(batch);
        console.log(`    ✅ Uploaded batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(embeddings.length/batchSize)}`);
      }
      
      totalEmbeddings += embeddings.length;
      console.log(`  ✅ Completed ${client.name} at ${client.company} (${embeddings.length} embeddings)`);
    }
    
    console.log(`\n🎉 Successfully generated ${totalEmbeddings} additional embeddings!`);
    console.log(`📊 Total embeddings per client: 15`);
    console.log(`🏢 Total clients: ${clients.length}`);
    console.log(`🔢 Grand total: ${totalEmbeddings} new embeddings`);
    
  } catch (error) {
    console.error('❌ Error generating additional embeddings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateAdditionalEmbeddings(); 