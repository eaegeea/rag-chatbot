// Additional detailed client notes for enhanced RAG functionality
// 20 notes per client (240 total) with deal sizes, meetings, implementation details

export const additionalNotes = [
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
  { id: 40, client_id: 1, content: 'Contract signed! $125,000 annual deal closed. Implementation kickoff meeting scheduled for Monday. John excited to get started.', note_type: 'call' },

  // Sarah Wilson (Data Solutions Inc) - Alice's client - IDs 41-60
  { id: 41, client_id: 2, content: 'Proposed deal value: $78,000 for 18-month contract. Sarah\'s budget cycle aligns with our Q4 closing goals.', note_type: 'pricing' },
  { id: 42, client_id: 2, content: 'Meeting count: 6 formal meetings plus 12 technical calls. Sarah\'s team very engaged throughout evaluation process.', note_type: 'meeting' },
  { id: 43, client_id: 2, content: 'Healthcare compliance paramount: HIPAA audit scheduled next week. Sarah needs all documentation before board meeting.', note_type: 'call' },
  { id: 44, client_id: 2, content: 'Technical architecture review: Must integrate with Epic EHR system. Sarah\'s IT director wants proof of concept first.', note_type: 'meeting' },
  { id: 45, client_id: 2, content: 'Patient data volume: 2.5 million records to migrate. Sarah concerned about HIPAA compliance during transfer process.', note_type: 'concern' },
  { id: 46, client_id: 2, content: 'ROI projections: 18% reduction in administrative overhead, saving $95K annually. Sarah impressed with healthcare benchmarks.', note_type: 'call' },
  { id: 47, client_id: 2, content: 'Pilot program results: 88% clinician satisfaction, 22% faster report generation. Sarah wants to extend pilot 2 more weeks.', note_type: 'email' },
  { id: 48, client_id: 2, content: 'Competitive landscape: Meditech quoted $85K, Cerner at $72K. Our advantage is specialized healthcare analytics module.', note_type: 'concern' },
  { id: 49, client_id: 2, content: 'Training requirements: 120 users across 4 departments. Sarah wants train-the-trainer approach to reduce costs.', note_type: 'meeting' },
  { id: 50, client_id: 2, content: 'Data backup requirements: 7-year retention policy for patient records. Sarah needs confirmation of compliance capabilities.', note_type: 'call' },
  { id: 51, client_id: 2, content: 'Performance metrics: Sub-3 second query response for patient lookups. Sarah\'s team tested with 50 concurrent users successfully.', note_type: 'meeting' },
  { id: 52, client_id: 2, content: 'Contract negotiation: Sarah requesting 6-month payment terms and 15% early payment discount. CFO approval needed.', note_type: 'pricing' },
  { id: 53, client_id: 2, content: 'Security assessment passed: Penetration testing and vulnerability scan completed. Sarah\'s CISO signed security approval.', note_type: 'email' },
  { id: 54, client_id: 2, content: 'Implementation phases: Phase 1 - Registration (4 weeks), Phase 2 - Clinical (6 weeks), Phase 3 - Billing (3 weeks).', note_type: 'call' },
  { id: 55, client_id: 2, content: 'Change management plan: Sarah\'s team identified 8 super users for each department. Go-live support for 2 weeks planned.', note_type: 'meeting' },
  { id: 56, client_id: 2, content: 'Integration testing: HL7 interfaces with lab systems successful. Sarah\'s team ready for production deployment.', note_type: 'call' },
  { id: 57, client_id: 2, content: 'Budget approved! Board meeting went well, Sarah got full $78K authorization. Contract review with legal next week.', note_type: 'call' },
  { id: 58, client_id: 2, content: 'Disaster recovery tested: 2-hour RTO meets Sarah\'s requirements. Backup facility 200 miles away satisfies compliance.', note_type: 'meeting' },
  { id: 59, client_id: 2, content: 'Go-live date set: March 15th for Phase 1. Sarah coordinating with IT team for weekend deployment to minimize disruption.', note_type: 'call' },
  { id: 60, client_id: 2, content: 'Success! Contract executed for $78,000. Sarah excited about improving patient care with better data insights.', note_type: 'email' }
];

export const getAdditionalNotesBatch = (startId, endId) => {
  return additionalNotes.filter(note => note.id >= startId && note.id <= endId);
}; 