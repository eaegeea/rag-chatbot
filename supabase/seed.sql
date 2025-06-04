-- Seed data for the RAG Sales Chatbot

-- Insert organization
INSERT INTO organizations (id, name) VALUES 
(1, 'Company');

-- Insert regions
INSERT INTO regions (id, name, organization_id) VALUES 
(1, 'East', 1),
(2, 'West', 1);

-- Insert users (updated roles: sales_manager -> salesmanager)
INSERT INTO users (id, email, name, role, region_id, organization_id) VALUES 
-- East Region
(1, 'alice@company.com', 'Alice Johnson', 'salesperson', 1, 1),
(2, 'bob@company.com', 'Bob Smith', 'salesperson', 1, 1),
(3, 'carol@company.com', 'Carol Williams', 'salesmanager', 1, 1),
-- West Region
(4, 'david@company.com', 'David Brown', 'salesperson', 2, 1),
(5, 'eve@company.com', 'Eve Davis', 'salesperson', 2, 1),
(6, 'frank@company.com', 'Frank Miller', 'salesmanager', 2, 1);

-- Insert clients (renamed from customers, salesperson_id -> assigned_id)
INSERT INTO clients (id, name, company, region_id, assigned_id) VALUES 
-- East Region - Alice's clients
(1, 'John Peterson', 'Tech Corp', 1, 1),
(2, 'Sarah Wilson', 'Data Solutions Inc', 1, 1),
(3, 'Mike Thompson', 'Cloud Systems LLC', 1, 1),
-- East Region - Bob's clients  
(4, 'Lisa Garcia', 'Innovation Labs', 1, 2),
(5, 'Tom Anderson', 'Digital Enterprises', 1, 2),
(6, 'Anna Rodriguez', 'Future Tech Co', 1, 2),
-- West Region - David's clients
(7, 'Chris Lee', 'West Coast Ventures', 2, 4),
(8, 'Rachel Kim', 'Pacific Systems', 2, 4),
(9, 'Mark Taylor', 'Coastal Analytics', 2, 4),
-- West Region - Eve's clients
(10, 'Jessica White', 'Mountain View Corp', 2, 5),
(11, 'Ryan Martinez', 'Silicon Solutions', 2, 5),
(12, 'Amy Chen', 'Golden Gate Tech', 2, 5);

-- Insert client notes (renamed from customer_notes, customer_id -> client_id)
INSERT INTO client_notes (id, client_id, content, note_type) VALUES 
-- Alice's client notes (East Region)
(1, 1, 'John expressed concerns about our pricing structure during the Q3 review. He mentioned that competitors are offering similar services at 20% lower cost. Need to prepare cost justification document.', 'concern'),
(2, 1, 'Follow-up call with John went well. Discussed implementation timeline and technical requirements. He is interested in our premium support package.', 'call'),
(3, 2, 'Sarah requested detailed security compliance documentation. Her company has strict data protection requirements due to healthcare clients.', 'meeting'),
(4, 2, 'Pricing discussion with Sarah - she has budget approved for $50K but wants to see ROI projections over 18 months.', 'pricing'),
(5, 3, 'Mike is very satisfied with current service. Mentioned potential expansion to their European operations. Great upsell opportunity.', 'meeting'),

-- Bob's client notes (East Region)
(6, 4, 'Lisa raised integration concerns about our API compatibility with their legacy systems. Technical team needs to review their current architecture.', 'concern'),
(7, 4, 'Successful demo session with Lisa''s team. They were impressed with the dashboard functionality and reporting capabilities.', 'meeting'),
(8, 5, 'Tom requested expedited deployment timeline. His company has a major product launch in Q1 and needs our solution operational by then.', 'call'),
(9, 5, 'Pricing negotiation with Tom - he wants volume discount for multi-year contract. Need management approval for special pricing.', 'pricing'),
(10, 6, 'Anna provided positive feedback on pilot program results. 30% improvement in operational efficiency reported by her team.', 'email'),

-- David's client notes (West Region)  
(11, 7, 'Chris highlighted performance requirements for high-traffic scenarios. Need to discuss our enterprise scaling capabilities.', 'meeting'),
(12, 7, 'Competitive pressure from local vendor. Chris mentioned they received aggressive pricing proposal. Need to respond quickly.', 'concern'),
(13, 8, 'Rachel expressed satisfaction with current pilot phase. Her team adapted quickly to our interface and workflows.', 'call'),
(14, 8, 'Discussed customization requirements with Rachel. She needs specific reporting formats for regulatory compliance.', 'meeting'),
(15, 9, 'Mark raised questions about data backup and disaster recovery procedures. Security is top priority for his organization.', 'concern'),

-- Eve's client notes (West Region)
(16, 10, 'Jessica interested in expanding usage across additional departments. Potential to triple current contract value.', 'meeting'),
(17, 10, 'Pricing discussion - Jessica has budget constraints but sees strong value proposition. Exploring flexible payment terms.', 'pricing'),
(18, 11, 'Ryan reported excellent user adoption rates. 95% of team members actively using the platform daily.', 'email'),
(19, 11, 'Technical integration meeting with Ryan''s IT team. Discussed API endpoints and data synchronization requirements.', 'meeting'),
(20, 12, 'Amy requested comprehensive training program for her extended team. Planning multi-session onboarding schedule.', 'call');

-- Reset sequences to continue from where inserts left off
SELECT setval('organizations_id_seq', (SELECT MAX(id) FROM organizations));
SELECT setval('regions_id_seq', (SELECT MAX(id) FROM regions));
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('clients_id_seq', (SELECT MAX(id) FROM clients));
SELECT setval('client_notes_id_seq', (SELECT MAX(id) FROM client_notes)); 