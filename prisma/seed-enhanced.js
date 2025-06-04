import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with enhanced client notes...');
  
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
    
    // Generate enhanced client notes (20 original + 20 additional per client = 480 total)
    const allNotes = [];
    let noteId = 1;
    
    // Original base notes (20 total)
    const baseNotes = [
      { client_id: 1, content: 'John expressed concerns about our pricing structure during the Q3 review. He mentioned that competitors are offering similar services at 20% lower cost. Need to prepare cost justification document.', note_type: 'concern' },
      { client_id: 1, content: 'Follow-up call with John went well. Discussed implementation timeline and technical requirements. He is interested in our premium support package.', note_type: 'call' },
      { client_id: 2, content: 'Sarah requested detailed security compliance documentation. Her company has strict data protection requirements due to healthcare clients.', note_type: 'meeting' },
      { client_id: 2, content: 'Pricing discussion with Sarah - she has budget approved for $50K but wants to see ROI projections over 18 months.', note_type: 'pricing' },
      { client_id: 3, content: 'Mike is very satisfied with current service. Mentioned potential expansion to their European operations. Great upsell opportunity.', note_type: 'meeting' },
      { client_id: 4, content: 'Lisa raised integration concerns about our API compatibility with their legacy systems. Technical team needs to review their current architecture.', note_type: 'concern' },
      { client_id: 4, content: 'Successful demo session with Lisa\'s team. They were impressed with the dashboard functionality and reporting capabilities.', note_type: 'meeting' },
      { client_id: 5, content: 'Tom requested expedited deployment timeline. His company has a major product launch in Q1 and needs our solution operational by then.', note_type: 'call' },
      { client_id: 5, content: 'Pricing negotiation with Tom - he wants volume discount for multi-year contract. Need management approval for special pricing.', note_type: 'pricing' },
      { client_id: 6, content: 'Anna provided positive feedback on pilot program results. 30% improvement in operational efficiency reported by her team.', note_type: 'email' },
      { client_id: 7, content: 'Chris highlighted performance requirements for high-traffic scenarios. Need to discuss our enterprise scaling capabilities.', note_type: 'meeting' },
      { client_id: 7, content: 'Competitive pressure from local vendor. Chris mentioned they received aggressive pricing proposal. Need to respond quickly.', note_type: 'concern' },
      { client_id: 8, content: 'Rachel expressed satisfaction with current pilot phase. Her team adapted quickly to our interface and workflows.', note_type: 'call' },
      { client_id: 8, content: 'Discussed customization requirements with Rachel. She needs specific reporting formats for regulatory compliance.', note_type: 'meeting' },
      { client_id: 9, content: 'Mark raised questions about data backup and disaster recovery procedures. Security is top priority for his organization.', note_type: 'concern' },
      { client_id: 10, content: 'Jessica interested in expanding usage across additional departments. Potential to triple current contract value.', note_type: 'meeting' },
      { client_id: 10, content: 'Pricing discussion - Jessica has budget constraints but sees strong value proposition. Exploring flexible payment terms.', note_type: 'pricing' },
      { client_id: 11, content: 'Ryan reported excellent user adoption rates. 95% of team members actively using the platform daily.', note_type: 'email' },
      { client_id: 11, content: 'Technical integration meeting with Ryan\'s IT team. Discussed API endpoints and data synchronization requirements.', note_type: 'meeting' },
      { client_id: 12, content: 'Amy requested comprehensive training program for her extended team. Planning multi-session onboarding schedule.', note_type: 'call' }
    ];
    
    // Add base notes
    baseNotes.forEach(note => {
      allNotes.push({ id: noteId++, ...note });
    });
    
    // Enhanced note templates for each client (20 additional notes per client)
    const enhancedNoteTemplates = [
      { content: 'Deal size confirmed at $AMOUNT annual contract. Budget approval process requires CFO sign-off for amounts above $75K.', note_type: 'pricing' },
      { content: 'Completed MEETING_COUNT meetings total since initial contact. DECISION_MAKER team is very thorough in their evaluation process.', note_type: 'meeting' },
      { content: 'Implementation timeline: TIMELINE_WEEKS rollout starting QUARTER. Phased deployment across DEPT_COUNT departments. Training for USER_COUNT users required.', note_type: 'call' },
      { content: 'Competitor analysis: COMPETITOR_1 quoted $COMP_PRICE_1 and COMPETITOR_2 at $COMP_PRICE_2. Our differentiation is ADVANTAGE.', note_type: 'concern' },
      { content: 'ROI calculations show PRODUCTIVITY_GAIN% productivity increase and $SAVINGS_AMOUNT savings annually. Very impressed with business case.', note_type: 'meeting' },
      { content: 'Contract terms negotiated: CONTRACT_LENGTH agreement with DISCOUNT% discount for upfront payment. Prefers BILLING_CYCLE billing cycle.', note_type: 'pricing' },
      { content: 'Security audit completed successfully. IT team approved our SOC2 compliance and penetration testing results. All requirements met.', note_type: 'meeting' },
      { content: 'User training program designed: ADMIN_SESSIONS sessions for admins, END_USER_SESSIONS for end users. Wants recorded sessions for future reference.', note_type: 'call' },
      { content: 'Integration requirements: Must connect with SYSTEM_1, SYSTEM_2, and their custom ERP system. Development estimate: DEV_WEEKS weeks.', note_type: 'meeting' },
      { content: 'Support package selected: SUPPORT_TIER tier with RESPONSE_TIME response time. Concerned about downtime during peak hours.', note_type: 'call' },
      { content: 'Pilot results: USER_SATISFACTION% user satisfaction, EFFICIENCY_GAIN% faster report generation, REDUCTION% reduction in manual work. Very pleased.', note_type: 'email' },
      { content: 'Budget approval received! CFO signed off on $FINAL_AMOUNT investment. Can proceed with contract signing next week.', note_type: 'call' },
      { content: 'Data migration plan finalized: DATA_SIZE of historical data to transfer. Team will provide data mapping by end of week.', note_type: 'meeting' },
      { content: 'Compliance requirements met: COMPLIANCE_1, COMPLIANCE_2, and COMPLIANCE_3 certifications verified. Legal team completed contract review.', note_type: 'email' },
      { content: 'Performance benchmarks established: UPTIME_SLA% uptime SLA, sub-RESPONSE_SEC second response times, CONCURRENT_USERS concurrent users supported.', note_type: 'meeting' },
      { content: 'Change management strategy developed with HR team. Communication plan for ROLLOUT_WEEKS rollout to minimize disruption.', note_type: 'call' },
      { content: 'Custom dashboard requirements: Executive summary, department metrics, real-time alerts. Wants mobile access for C-suite.', note_type: 'meeting' },
      { content: 'Disaster recovery plan discussed: RTO of RTO_HOURS hours, RPO of RPO_HOURS hours. Satisfied with our backup data center capabilities.', note_type: 'call' },
      { content: 'Success metrics defined: PRODUCTIVITY_TARGET% productivity gain in 6 months, ADOPTION_TARGET% user adoption, COST_REDUCTION% cost reduction target.', note_type: 'meeting' },
      { content: 'Contract signed! $FINAL_DEAL_AMOUNT annual deal closed. Implementation kickoff meeting scheduled for Monday. Very excited to get started.', note_type: 'call' }
    ];
    
    // Client-specific data for personalization
    const clientData = [
      // John Peterson - Tech Corp
      { amounts: [125000, 180000, 98000, 102000, 125000], meetings: 8, timeline: 6, dept: 3, users: 45, competitors: ['TechSol', 'DataMax'], advantage: 'superior analytics and 24/7 support' },
      // Sarah Wilson - Data Solutions Inc  
      { amounts: [78000, 95000, 85000, 72000, 78000], meetings: 6, timeline: 18, dept: 4, users: 120, competitors: ['Meditech', 'Cerner'], advantage: 'specialized healthcare analytics' },
      // Mike Thompson - Cloud Systems LLC
      { amounts: [95000, 140000, 88000, 92000, 95000], meetings: 5, timeline: 8, dept: 2, users: 85, competitors: ['CloudFirst', 'SysMax'], advantage: 'European data centers' },
      // Lisa Garcia - Innovation Labs
      { amounts: [67000, 85000, 65000, 71000, 67000], meetings: 7, timeline: 12, dept: 3, users: 60, competitors: ['InnoSoft', 'LabTech'], advantage: 'R&D specific modules' },
      // Tom Anderson - Digital Enterprises
      { amounts: [110000, 155000, 105000, 115000, 110000], meetings: 9, timeline: 4, dept: 5, users: 200, competitors: ['DigitalPro', 'Enterprise+'], advantage: 'rapid deployment capability' },
      // Anna Rodriguez - Future Tech Co
      { amounts: [89000, 120000, 82000, 94000, 89000], meetings: 6, timeline: 10, dept: 3, users: 75, competitors: ['FutureSys', 'TechAdvance'], advantage: 'AI-powered insights' },
      // Chris Lee - West Coast Ventures
      { amounts: [134000, 195000, 128000, 140000, 134000], meetings: 8, timeline: 14, dept: 4, users: 150, competitors: ['WestTech', 'VentureSoft'], advantage: 'venture capital reporting' },
      // Rachel Kim - Pacific Systems
      { amounts: [76000, 105000, 74000, 79000, 76000], meetings: 5, timeline: 6, dept: 2, users: 55, competitors: ['PacifiCorp', 'SystemsPlus'], advantage: 'regulatory compliance tools' },
      // Mark Taylor - Coastal Analytics
      { amounts: [98000, 135000, 95000, 102000, 98000], meetings: 7, timeline: 8, dept: 3, users: 90, competitors: ['CoastalTech', 'AnalyticsPro'], advantage: 'advanced security features' },
      // Jessica White - Mountain View Corp
      { amounts: [115000, 165000, 108000, 122000, 115000], meetings: 6, timeline: 12, dept: 6, users: 180, competitors: ['MountainSoft', 'ViewTech'], advantage: 'multi-department integration' },
      // Ryan Martinez - Silicon Solutions
      { amounts: [87000, 125000, 84000, 91000, 87000], meetings: 4, timeline: 7, dept: 2, users: 65, competitors: ['SiliconMax', 'SolutionsPro'], advantage: 'tech startup focus' },
      // Amy Chen - Golden Gate Tech
      { amounts: [102000, 145000, 98000, 107000, 102000], meetings: 8, timeline: 10, dept: 4, users: 110, competitors: ['GateTech', 'GoldenSoft'], advantage: 'comprehensive training program' }
    ];
    
    // Generate 20 additional notes for each client
    for (let clientId = 1; clientId <= 12; clientId++) {
      const data = clientData[clientId - 1];
      
      enhancedNoteTemplates.forEach((template, index) => {
        let content = template.content
          .replace('$AMOUNT', data.amounts[0].toLocaleString())
          .replace('MEETING_COUNT', data.meetings + index)
          .replace('TIMELINE_WEEKS', data.timeline)
          .replace('DEPT_COUNT', data.dept)
          .replace('USER_COUNT', data.users)
          .replace('COMPETITOR_1', data.competitors[0])
          .replace('COMPETITOR_2', data.competitors[1])
          .replace('$COMP_PRICE_1', data.amounts[2].toLocaleString())
          .replace('$COMP_PRICE_2', data.amounts[3].toLocaleString())
          .replace('ADVANTAGE', data.advantage)
          .replace('PRODUCTIVITY_GAIN', 15 + index)
          .replace('$SAVINGS_AMOUNT', data.amounts[1].toLocaleString())
          .replace('CONTRACT_LENGTH', ['2-year', '3-year', '1-year'][index % 3])
          .replace('DISCOUNT', 5 + (index % 15))
          .replace('BILLING_CYCLE', ['quarterly', 'monthly', 'annual'][index % 3])
          .replace('ADMIN_SESSIONS', 2 + (index % 3))
          .replace('END_USER_SESSIONS', 1 + (index % 2))
          .replace('SYSTEM_1', ['Salesforce', 'HubSpot', 'Pipedrive'][index % 3])
          .replace('SYSTEM_2', ['Slack', 'Teams', 'Discord'][index % 3])
          .replace('DEV_WEEKS', 1 + (index % 4))
          .replace('SUPPORT_TIER', ['Premium', 'Enterprise', 'Standard'][index % 3])
          .replace('RESPONSE_TIME', ['4-hour', '2-hour', '8-hour'][index % 3])
          .replace('USER_SATISFACTION', 85 + (index % 10))
          .replace('EFFICIENCY_GAIN', 10 + (index % 20))
          .replace('REDUCTION', 20 + (index % 15))
          .replace('$FINAL_AMOUNT', data.amounts[4].toLocaleString())
          .replace('DATA_SIZE', ['2.3TB', '1.8TB', '3.1TB', '950GB'][index % 4])
          .replace('COMPLIANCE_1', 'SOC2')
          .replace('COMPLIANCE_2', 'HIPAA')
          .replace('COMPLIANCE_3', 'PCI DSS')
          .replace('UPTIME_SLA', 99.9)
          .replace('RESPONSE_SEC', 1 + (index % 3))
          .replace('CONCURRENT_USERS', 100 + (index * 50))
          .replace('ROLLOUT_WEEKS', 2 + (index % 4))
          .replace('RTO_HOURS', 2 + (index % 6))
          .replace('RPO_HOURS', 1 + (index % 2))
          .replace('PRODUCTIVITY_TARGET', 20 + (index % 10))
          .replace('ADOPTION_TARGET', 90 + (index % 8))
          .replace('COST_REDUCTION', 15 + (index % 10))
          .replace('$FINAL_DEAL_AMOUNT', data.amounts[4].toLocaleString())
          .replace('DECISION_MAKER', ['John\'s', 'Sarah\'s', 'Mike\'s', 'Lisa\'s', 'Tom\'s', 'Anna\'s', 'Chris\'s', 'Rachel\'s', 'Mark\'s', 'Jessica\'s', 'Ryan\'s', 'Amy\'s'][clientId - 1])
          .replace('QUARTER', ['Q1 2024', 'Q2 2024', 'Q3 2024'][index % 3]);
        
        allNotes.push({
          id: noteId++,
          client_id: clientId,
          content: content,
          note_type: template.note_type
        });
      });
    }
    
    // Insert all notes in batches
    const batchSize = 50;
    for (let i = 0; i < allNotes.length; i += batchSize) {
      const batch = allNotes.slice(i, i + batchSize);
      await prisma.clientNote.createMany({ data: batch });
    }
    
    console.log('✅ Enhanced client notes created');
    console.log('🎉 Enhanced database seeded successfully!');
    console.log(`📊 Final counts:`);
    console.log(`   Organizations: 1`);
    console.log(`   Regions: 2`);
    console.log(`   Users: 7`);
    console.log(`   Clients: 12`);
    console.log(`   Client Notes: ${allNotes.length} (${allNotes.length - 20} new detailed notes)`);
    
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