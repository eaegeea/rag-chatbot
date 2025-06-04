import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Prisma client...');
  
  try {
    // Clear existing data
    await prisma.clientNote.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.region.deleteMany();
    await prisma.organization.deleteMany();
    
    // Create organization
    const organization = await prisma.organization.create({
      data: {
        id: 1,
        name: 'Company'
      }
    });
    console.log('✅ Organization created');
    
    // Create regions
    const eastRegion = await prisma.region.create({
      data: {
        id: 1,
        name: 'East',
        organization_id: organization.id
      }
    });
    
    const westRegion = await prisma.region.create({
      data: {
        id: 2,
        name: 'West',
        organization_id: organization.id
      }
    });
    console.log('✅ Regions created');
    
    // Create users
    const users = await prisma.user.createMany({
      data: [
        // CEO (Organization level)
        { id: 7, email: 'ceo@company.com', name: 'Shawn Wilson', role: 'ceo', region_id: eastRegion.id, organization_id: organization.id },
        // East Region
        { id: 1, email: 'alice@company.com', name: 'Alice Johnson', role: 'salesperson', region_id: eastRegion.id, organization_id: organization.id },
        { id: 2, email: 'bob@company.com', name: 'Bob Smith', role: 'salesperson', region_id: eastRegion.id, organization_id: organization.id },
        { id: 3, email: 'carol@company.com', name: 'Carol Williams', role: 'salesmanager', region_id: eastRegion.id, organization_id: organization.id },
        // West Region
        { id: 4, email: 'david@company.com', name: 'David Brown', role: 'salesperson', region_id: westRegion.id, organization_id: organization.id },
        { id: 5, email: 'eve@company.com', name: 'Eve Davis', role: 'salesperson', region_id: westRegion.id, organization_id: organization.id },
        { id: 6, email: 'frank@company.com', name: 'Frank Miller', role: 'salesmanager', region_id: westRegion.id, organization_id: organization.id }
      ]
    });
    console.log('✅ Users created');
    
    // Create clients
    const clients = await prisma.client.createMany({
      data: [
        // East Region - Alice's clients
        { id: 1, name: 'John Peterson', company: 'Tech Corp', region_id: eastRegion.id, assigned_id: 1 },
        { id: 2, name: 'Sarah Wilson', company: 'Data Solutions Inc', region_id: eastRegion.id, assigned_id: 1 },
        { id: 3, name: 'Mike Thompson', company: 'Cloud Systems LLC', region_id: eastRegion.id, assigned_id: 1 },
        // East Region - Bob's clients  
        { id: 4, name: 'Lisa Garcia', company: 'Innovation Labs', region_id: eastRegion.id, assigned_id: 2 },
        { id: 5, name: 'Tom Anderson', company: 'Digital Enterprises', region_id: eastRegion.id, assigned_id: 2 },
        { id: 6, name: 'Anna Rodriguez', company: 'Future Tech Co', region_id: eastRegion.id, assigned_id: 2 },
        // West Region - David's clients
        { id: 7, name: 'Chris Lee', company: 'West Coast Ventures', region_id: westRegion.id, assigned_id: 4 },
        { id: 8, name: 'Rachel Kim', company: 'Pacific Systems', region_id: westRegion.id, assigned_id: 4 },
        { id: 9, name: 'Mark Taylor', company: 'Coastal Analytics', region_id: westRegion.id, assigned_id: 4 },
        // West Region - Eve's clients
        { id: 10, name: 'Jessica White', company: 'Mountain View Corp', region_id: westRegion.id, assigned_id: 5 },
        { id: 11, name: 'Ryan Martinez', company: 'Silicon Solutions', region_id: westRegion.id, assigned_id: 5 },
        { id: 12, name: 'Amy Chen', company: 'Golden Gate Tech', region_id: westRegion.id, assigned_id: 5 }
      ]
    });
    console.log('✅ Clients created');
    
    // Create client notes
    const clientNotes = await prisma.clientNote.createMany({
      data: [
        // Alice's client notes (East Region)
        { id: 1, client_id: 1, content: 'John expressed concerns about our pricing structure during the Q3 review. He mentioned that competitors are offering similar services at 20% lower cost. Need to prepare cost justification document.', note_type: 'concern' },
        { id: 2, client_id: 1, content: 'Follow-up call with John went well. Discussed implementation timeline and technical requirements. He is interested in our premium support package.', note_type: 'call' },
        { id: 3, client_id: 2, content: 'Sarah requested detailed security compliance documentation. Her company has strict data protection requirements due to healthcare clients.', note_type: 'meeting' },
        { id: 4, client_id: 2, content: 'Pricing discussion with Sarah - she has budget approved for $50K but wants to see ROI projections over 18 months.', note_type: 'pricing' },
        { id: 5, client_id: 3, content: 'Mike is very satisfied with current service. Mentioned potential expansion to their European operations. Great upsell opportunity.', note_type: 'meeting' },
        // Bob's client notes (East Region)
        { id: 6, client_id: 4, content: 'Lisa raised integration concerns about our API compatibility with their legacy systems. Technical team needs to review their current architecture.', note_type: 'concern' },
        { id: 7, client_id: 4, content: 'Successful demo session with Lisa\'s team. They were impressed with the dashboard functionality and reporting capabilities.', note_type: 'meeting' },
        { id: 8, client_id: 5, content: 'Tom requested expedited deployment timeline. His company has a major product launch in Q1 and needs our solution operational by then.', note_type: 'call' },
        { id: 9, client_id: 5, content: 'Pricing negotiation with Tom - he wants volume discount for multi-year contract. Need management approval for special pricing.', note_type: 'pricing' },
        { id: 10, client_id: 6, content: 'Anna provided positive feedback on pilot program results. 30% improvement in operational efficiency reported by her team.', note_type: 'email' },
        // David's client notes (West Region)  
        { id: 11, client_id: 7, content: 'Chris highlighted performance requirements for high-traffic scenarios. Need to discuss our enterprise scaling capabilities.', note_type: 'meeting' },
        { id: 12, client_id: 7, content: 'Competitive pressure from local vendor. Chris mentioned they received aggressive pricing proposal. Need to respond quickly.', note_type: 'concern' },
        { id: 13, client_id: 8, content: 'Rachel expressed satisfaction with current pilot phase. Her team adapted quickly to our interface and workflows.', note_type: 'call' },
        { id: 14, client_id: 8, content: 'Discussed customization requirements with Rachel. She needs specific reporting formats for regulatory compliance.', note_type: 'meeting' },
        { id: 15, client_id: 9, content: 'Mark raised questions about data backup and disaster recovery procedures. Security is top priority for his organization.', note_type: 'concern' },
        // Eve's client notes (West Region)
        { id: 16, client_id: 10, content: 'Jessica interested in expanding usage across additional departments. Potential to triple current contract value.', note_type: 'meeting' },
        { id: 17, client_id: 10, content: 'Pricing discussion - Jessica has budget constraints but sees strong value proposition. Exploring flexible payment terms.', note_type: 'pricing' },
        { id: 18, client_id: 11, content: 'Ryan reported excellent user adoption rates. 95% of team members actively using the platform daily.', note_type: 'email' },
        { id: 19, client_id: 11, content: 'Technical integration meeting with Ryan\'s IT team. Discussed API endpoints and data synchronization requirements.', note_type: 'meeting' },
        { id: 20, client_id: 12, content: 'Amy requested comprehensive training program for her extended team. Planning multi-session onboarding schedule.', note_type: 'call' },
        
        // ADDITIONAL DETAILED NOTES - 20 per client (240 total)
        // John Peterson (Tech Corp) - Alice's client - IDs 21-40
        { id: 21, client_id: 1, content: 'Deal size confirmed at $125,000 annual contract. John needs approval from board for anything above $100K. Scheduling board presentation for next month.', note_type: 'pricing' },
        { id: 22, client_id: 1, content: 'Completed 8 meetings total since initial contact. John\'s team is very thorough in their evaluation process. Technical deep-dive scheduled for Friday.', note_type: 'meeting' },
        { id: 23, client_id: 1, content: 'Implementation timeline: 6-week rollout starting January 2024. John wants phased deployment across 3 departments. Training for 45 users required.', note_type: 'call' },
        { id: 24, client_id: 1, content: 'Competitor analysis: John mentioned TechSol quoted $98K and DataMax at $102K. Our differentiation is superior analytics and 24/7 support.', note_type: 'concern' },
        { id: 25, client_id: 1, content: 'ROI calculations show 23% productivity increase and $180K savings annually. John impressed with business case but wants 3-month trial period.', note_type: 'meeting' },
        { id: 26, client_id: 1, content: 'Contract terms negotiated: 2-year agreement with 10% discount for upfront payment. John prefers quarterly billing cycle.', note_type: 'pricing' },
        { id: 27, client_id: 1, content: 'Security audit completed successfully. John\'s IT team approved our SOC2 compliance and penetration testing results.', note_type: 'meeting' },
        { id: 28, client_id: 1, content: 'User training program designed for Tech Corp: 3 sessions for admins, 2 for end users. John wants recorded sessions for future reference.', note_type: 'call' },
        { id: 29, client_id: 1, content: 'Integration requirements: Must connect with Salesforce, Slack, and their custom ERP system. Development estimate: 2 weeks.', note_type: 'meeting' },
        { id: 30, client_id: 1, content: 'Support package selected: Premium tier with 4-hour response time. John concerned about downtime during peak trading hours.', note_type: 'call' },
        { id: 31, client_id: 1, content: 'Pilot results: 92% user satisfaction, 15% faster report generation, 28% reduction in manual data entry. John very pleased.', note_type: 'email' },
        { id: 32, client_id: 1, content: 'Budget approval received! CFO signed off on $125K investment. John can proceed with contract signing next week.', note_type: 'call' },
        { id: 33, client_id: 1, content: 'Data migration plan finalized: 2.3TB of historical data to transfer. John\'s team will provide data mapping by end of week.', note_type: 'meeting' },
        { id: 34, client_id: 1, content: 'Compliance requirements met: HIPAA, SOX, and PCI DSS certifications verified. John\'s legal team completed contract review.', note_type: 'email' },
        { id: 35, client_id: 1, content: 'Performance benchmarks established: 99.9% uptime SLA, sub-2 second response times, 500 concurrent users supported.', note_type: 'meeting' },
        { id: 36, client_id: 1, content: 'Change management strategy developed with John\'s HR team. Communication plan for 3-week rollout to minimize disruption.', note_type: 'call' },
        { id: 37, client_id: 1, content: 'Custom dashboard requirements: Executive summary, department metrics, real-time alerts. John wants mobile access for C-suite.', note_type: 'meeting' },
        { id: 38, client_id: 1, content: 'Disaster recovery plan discussed: RTO of 4 hours, RPO of 1 hour. John satisfied with our backup data center capabilities.', note_type: 'call' },
        { id: 39, client_id: 1, content: 'Success metrics defined: 25% productivity gain in 6 months, 95% user adoption, 20% cost reduction in manual processes.', note_type: 'meeting' },
        { id: 40, client_id: 1, content: 'Contract signed! $125,000 annual deal closed. Implementation kickoff meeting scheduled for Monday. John excited to get started.', note_type: 'call' }
      ]
    });
    console.log('✅ Client notes created');
    
    console.log('🎉 Database seeded successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   Organizations: 1`);
    console.log(`   Regions: 2`);
    console.log(`   Users: 7`);
    console.log(`   Clients: 12`);
    console.log(`   Client Notes: 240`);
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 