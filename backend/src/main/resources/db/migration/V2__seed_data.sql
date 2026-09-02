-- V2: Seed Data for Verdant CRM

-- Roles
INSERT INTO roles (id, name) VALUES (1, 'ROLE_ADMIN'), (2, 'ROLE_STAFF')
ON CONFLICT (name) DO NOTHING;

-- Default Users:
-- Admin: admin@verdantcrm.com / Admin@123  (BCrypt: $2a$10$eACCYoNOHEqXve8aIWT8Nu3Pk713v8.xZ714Gj1v929B9y5X1gL0m)
-- Staff 1: sarah.chen@verdantcrm.com / Staff@123
-- Staff 2: marcus.vance@verdantcrm.com / Staff@123
-- Staff 3: elena.rostova@verdantcrm.com / Staff@123

INSERT INTO users (id, full_name, email, password_hash, role, avatar_url, title, department) VALUES
(1, 'Arthur Pendelton', 'admin@verdantcrm.com', '$2a$10$D8b4uE6gA4N7fPZ3y1v/O.Vn2yO6z5Z2i6I8k7l5O4n3m2l1k0j9i', 'ADMIN', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', 'Managing Director', 'Executive'),
(2, 'Sarah Chen', 'sarah.chen@verdantcrm.com', '$2a$10$D8b4uE6gA4N7fPZ3y1v/O.Vn2yO6z5Z2i6I8k7l5O4n3m2l1k0j9i', 'STAFF', 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80', 'Senior Solutions Architect', 'Commercial Solutions'),
(3, 'Marcus Vance', 'marcus.vance@verdantcrm.com', '$2a$10$D8b4uE6gA4N7fPZ3y1v/O.Vn2yO6z5Z2i6I8k7l5O4n3m2l1k0j9i', 'STAFF', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', 'Field Project Lead', 'Operations'),
(4, 'Elena Rostova', 'elena.rostova@verdantcrm.com', '$2a$10$D8b4uE6gA4N7fPZ3y1v/O.Vn2yO6z5Z2i6I8k7l5O4n3m2l1k0j9i', 'STAFF', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', 'Account Director', 'Client Services')
ON CONFLICT (email) DO NOTHING;

-- Reset sequence for users
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Customers
INSERT INTO customers (id, customer_code, name, company, email, phone, address, city, total_value, status, customer_since, notes) VALUES
(1, 'CUST-801', 'Julian Thorne', 'Aetheric BioLabs Inc.', 'j.thorne@aethericbio.com', '+1 (555) 249-8810', '450 Innovation Parkway, Suite 300', 'San Francisco, CA', 485000.00, 'ACTIVE', '2025-11-14', 'Tier 1 client. Clean-room ventilation retrofitting and power monitoring system.'),
(2, 'CUST-802', 'Miriam Al-Mansoor', 'Solstice Hospitality Group', 'miriam@solsticehotels.com', '+1 (555) 831-4092', '120 Ocean View Terrace', 'Carmel, CA', 320000.00, 'ACTIVE', '2026-01-20', 'Luxury resort properties across Central Coast. Solar canopy and thermal HVAC.'),
(3, 'CUST-803', 'Dominic Sterling', 'Sterling & Vane Logistics', 'dsterling@sterlingvane.co', '+1 (555) 714-9923', '88 Harbor Industrial Blvd', 'Oakland, CA', 740000.00, 'ACTIVE', '2025-08-05', 'High bay warehouse automation & microgrid backup systems.'),
(4, 'CUST-804', 'Clara Henderson', 'Vanguard Architectural Studio', 'clara@vanguardarch.design', '+1 (555) 412-6638', '310 Mission St, 8th Floor', 'San Francisco, CA', 185000.00, 'ACTIVE', '2026-03-10', 'Architectural firm collaborating on green building certifications.'),
(5, 'CUST-805', 'Nikhil Sharma', 'Helix Micro-Mobility HQ', 'nikhil@helixmobility.io', '+1 (555) 902-1147', '2100 Tech Hub Way', 'San Jose, CA', 95000.00, 'LEAD', '2026-05-18', 'Rapidly expanding fleet depot. Requires high-voltage charging cluster.');

SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- Leads
INSERT INTO leads (id, lead_code, name, email, phone, company, source, location, requirement, estimated_value, status, assigned_user_id, customer_id, last_contacted_at, notes) VALUES
(1, 'LEAD-101', 'Lydia Fontaine', 'l.fontaine@fontainewinery.com', '+1 (555) 672-9011', 'Fontaine Estate Winery', 'Referral', 'Napa Valley, CA', 'Full temperature-controlled barrel cellar climate overhaul and solar array.', 260000.00, 'NEW', 2, NULL, NULL, 'Urgent inquiry received via industry partner referral. Has not been contacted yet.'),
(2, 'LEAD-102', 'Harrison Blake', 'hblake@blakemetals.com', '+1 (555) 890-3344', 'Blake Precision Fabrication', 'Website', 'Fremont, CA', 'Heavy industrial dust collection and heat-recovery ventilation unit.', 195000.00, 'CONTACTED', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '3 days', 'Initial discovery call held. Site visit requested for next week.'),
(3, 'LEAD-103', 'Dr. Evelyn Cross', 'evelyn.cross@nordicgenetics.com', '+1 (555) 345-7788', 'Nordic Genetics Research', 'Exhibition', 'Palo Alto, CA', 'Precision cleanroom HVAC with N+1 backup redundancy.', 410000.00, 'QUALIFIED', 2, 1, CURRENT_TIMESTAMP - INTERVAL '1 day', 'Decision makers identified. Preparing site survey measurements.'),
(4, 'LEAD-104', 'Mateo Rossi', 'mrossi@urbanliving.dev', '+1 (555) 987-6543', 'Urban Living Developments', 'Cold Outreach', 'San Jose, CA', 'Multi-family residential complex heat pump infrastructure.', 520000.00, 'SURVEY_SCHEDULED', 3, NULL, CURRENT_TIMESTAMP - INTERVAL '2 days', 'Survey booked for Thursday morning with Marcus Vance.'),
(5, 'LEAD-105', 'Chloe Dubois', 'cdubois@novaterracom.net', '+1 (555) 234-9081', 'NovaTerra Data Centers', 'Partner', 'Santa Clara, CA', 'Direct liquid cooling loop & high-efficiency dry coolers.', 850000.00, 'QUOTE_SENT', 4, NULL, CURRENT_TIMESTAMP - INTERVAL '6 days', 'Formal proposal sent. Follow up needed — client opened proposal 3 days ago.'),
(6, 'LEAD-106', 'Tariq Al-Fassi', 'tariq@skylinecapital.org', '+1 (555) 654-3210', 'Skyline Tower Partners', 'Referral', 'San Francisco, CA', '40-story commercial tower cooling tower upgrade.', 680000.00, 'NEW', 2, NULL, NULL, 'New inbound RFQ. High-profile project requiring prompt executive outreach.');

SELECT setval('leads_id_seq', (SELECT MAX(id) FROM leads));

-- Site Surveys
INSERT INTO site_surveys (id, survey_code, customer_id, lead_id, address, survey_date, survey_time, assigned_user_id, status, measurements, notes) VALUES
(1, 'SURV-301', 1, 3, '450 Innovation Parkway, Suite 300, San Francisco', CURRENT_DATE + INTERVAL '1 day', '09:30 AM', 3, 'SCHEDULED', 'Awaiting on-site laser dimension scan of mechanical loft.', 'Bring digital airflow meter and sound level analyzer.'),
(2, 'SURV-302', 2, 4, '120 Ocean View Terrace, Carmel', CURRENT_DATE + INTERVAL '2 days', '02:00 PM', 3, 'SCHEDULED', 'Roof load calculation and thermal imaging scan needed.', 'Coordinate with on-site facility director Mr. Ruiz.'),
(3, 'SURV-303', 3, NULL, '88 Harbor Industrial Blvd, Oakland', CURRENT_DATE - INTERVAL '3 days', '10:00 AM', 2, 'COMPLETED', 'Total floor area: 84,000 sq ft. Ceiling height: 38 ft. Substation capacity verified at 2.4 MW.', 'Structural beams adequate for modular chiller units.'),
(4, 'SURV-304', 5, NULL, '2100 Tech Hub Way, San Jose', CURRENT_DATE - INTERVAL '10 days', '11:00 AM', 3, 'COMPLETED', 'Switchboard amperage: 1600A 480V. Conduit pathways mapped.', 'Client requested revised single-line electrical diagram.');

SELECT setval('site_surveys_id_seq', (SELECT MAX(id) FROM site_surveys));

-- Quotes
INSERT INTO quotes (id, quote_number, customer_id, lead_id, project_type, description, amount, cost, status, valid_until, assigned_user_id, notes) VALUES
(1, 'Q-2026-089', 1, 3, 'Cleanroom Mechanical Upgrade', 'High efficiency HEPA filtration, dedicated fresh air makeup units, and automated building management integration.', 385000.00, 240000.00, 'SENT', CURRENT_DATE + INTERVAL '14 days', 2, 'Sent 6 days ago. Follow-up recommended to close before quarter end.'),
(2, 'Q-2026-090', 2, NULL, 'Resort Solar & Thermal Loop', '180kW commercial rooftop solar array paired with water-to-water heat pump chiller system.', 295000.00, 268000.00, 'VIEWED', CURRENT_DATE + INTERVAL '7 days', 4, 'Low margin warning (9.15% margin). Needs pricing adjustment or cost optimization.'),
(3, 'Q-2026-091', 3, NULL, 'High-Bay Microgrid & Storage', '1.2MWh battery energy storage system with dynamic peak-shaving controller.', 620000.00, 390000.00, 'ACCEPTED', CURRENT_DATE - INTERVAL '5 days', 2, 'Contract signed. Ready to convert to active Project flow.'),
(4, 'Q-2026-092', 4, NULL, 'Studio Studio Thermal Envelope', 'Precision climate regulation system for architectural model fabrication labs.', 145000.00, 92000.00, 'DRAFT', CURRENT_DATE + INTERVAL '30 days', 4, 'Drafting bill of materials with vendor quotes.'),
(5, 'Q-2026-093', 5, 5, 'Fleet Depot Charging Grid', 'Ultra-fast DC charging hubs with liquid-cooled cables and transformer substation.', 480000.00, 310000.00, 'SENT', CURRENT_DATE + INTERVAL '10 days', 3, 'Sent to Nikhil Sharma. Unfollowed for 5 days.');

SELECT setval('quotes_id_seq', (SELECT MAX(id) FROM quotes));

-- Projects
INSERT INTO projects (id, project_number, customer_id, quote_id, project_name, location, start_date, expected_completion, actual_completion, assigned_user_id, status, budget, progress_percentage, notes) VALUES
(1, 'PRJ-401', 3, 3, 'Sterling Logistics Microgrid Phase 1', '88 Harbor Industrial Blvd, Oakland', CURRENT_DATE - INTERVAL '45 days', CURRENT_DATE + INTERVAL '20 days', NULL, 3, 'IN_PROGRESS', 620000.00, 68, 'Battery storage modules delivered. Electrical tie-in scheduled with utility company.'),
(2, 'PRJ-402', 1, NULL, 'BioLabs BSL-2 Climate Control', '450 Innovation Parkway, San Francisco', CURRENT_DATE - INTERVAL '90 days', CURRENT_DATE - INTERVAL '10 days', NULL, 2, 'DELAYED', 485000.00, 82, 'Delayed due to backordered custom explosion-proof exhaust dampers. Expedited delivery expected.'),
(3, 'PRJ-403', 2, NULL, 'Solstice Carmel Coastal Chiller', '120 Ocean View Terrace, Carmel', CURRENT_DATE - INTERVAL '120 days', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '12 days', 3, 'COMPLETED', 320000.00, 100, 'Commissioning completed successfully. Handed over to client facility team.'),
(4, 'PRJ-404', 4, NULL, 'Vanguard Design Center Green Retrofit', '310 Mission St, San Francisco', CURRENT_DATE + INTERVAL '15 days', CURRENT_DATE + INTERVAL '120 days', NULL, 4, 'PLANNED', 185000.00, 0, 'Permit approvals received from city planning office.');

SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));

-- Payments
INSERT INTO payments (id, payment_code, customer_id, project_id, amount, payment_date, due_date, payment_method, status, reference_number, notes) VALUES
(1, 'PAY-501', 3, 1, 186000.00, CURRENT_DATE - INTERVAL '40 days', CURRENT_DATE - INTERVAL '42 days', 'Wire Transfer', 'PAID', 'WIRE-2026-883921', 'Milestone 1: Procurement mobilization deposit received.'),
(2, 'PAY-502', 3, 1, 217000.00, NULL, CURRENT_DATE - INTERVAL '8 days', 'Bank Transfer', 'OVERDUE', 'INV-2026-091-M2', 'Milestone 2: Substation delivery invoice overdue by 8 days ($217,000). Needs urgent follow-up.'),
(3, 'PAY-503', 1, 2, 145000.00, NULL, CURRENT_DATE - INTERVAL '14 days', 'Bank Transfer', 'OVERDUE', 'INV-2026-042-M3', 'Overdue stage billing for BioLabs project. Accounts payable contact notified.'),
(4, 'PAY-504', 2, 3, 96000.00, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '12 days', 'Stripe', 'PAID', 'STRIPE-CH-99410', 'Final retention release invoice paid in full.'),
(5, 'PAY-505', 4, 4, 55500.00, NULL, CURRENT_DATE + INTERVAL '12 days', 'Cheque', 'DUE', 'INV-2026-104-D1', 'Mobilization invoice issued for Vanguard project.');

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- Service & Warranty Requests
INSERT INTO service_requests (id, ticket_code, customer_id, project_id, issue, description, priority, status, assigned_user_id, due_date, resolution, notes) VALUES
(1, 'SRV-701', 2, 3, 'Chiller Sensor Calibration Offset', 'Temperature sensor on loop B showing 2.4°C divergence from digital controller.', 'HIGH', 'IN_PROGRESS', 3, CURRENT_DATE + INTERVAL '2 days', NULL, 'Technician dispatched with calibrated thermal probes.'),
(2, 'SRV-702', 1, 2, 'Exhaust Air Velocity Warning', 'Differential pressure switch triggering false positive alarm on cleanroom damper 4.', 'MEDIUM', 'OPEN', 2, CURRENT_DATE + INTERVAL '4 days', NULL, 'Pending scheduled maintenance window.'),
(3, 'SRV-703', 3, 1, 'Inverter Firmware Update Request', 'Utility grid operator requiring IEEE 1547-2018 compliance firmware patch on BESS.', 'LOW', 'RESOLVED', 3, CURRENT_DATE - INTERVAL '2 days', 'Firmware v4.2.1 uploaded and telemetry certified with utility engineers.', 'Case closed smoothly.');

SELECT setval('service_requests_id_seq', (SELECT MAX(id) FROM service_requests));

-- Activities (Movement Today)
INSERT INTO activities (id, user_id, action_type, entity_type, entity_id, title, description, icon, badge_type, created_at) VALUES
(1, 2, 'QUOTE_VIEWED', 'QUOTE', 2, 'Client viewed proposal', 'Miriam Al-Mansoor opened quote Q-2026-090 ($295,000) for Solstice Hospitality', 'eye', 'info', CURRENT_TIMESTAMP - INTERVAL '14 minutes'),
(2, 3, 'SURVEY_COMPLETED', 'SURVEY', 3, 'Site survey completed', 'Marcus Vance finished on-site measurements at Sterling Logistics Oakland facility', 'check-circle', 'success', CURRENT_TIMESTAMP - INTERVAL '1 hour 20 minutes'),
(3, 1, 'PAYMENT_OVERDUE', 'PAYMENT', 2, 'Payment overdue alert', 'Invoice INV-2026-091-M2 ($217,000) is now 8 days past due from Sterling Logistics', 'alert-triangle', 'danger', CURRENT_TIMESTAMP - INTERVAL '3 hours'),
(4, 4, 'LEAD_CREATED', 'LEAD', 6, 'New high-value lead added', 'Tariq Al-Fassi from Skyline Tower Partners submitted RFQ ($680,000)', 'sparkles', 'success', CURRENT_TIMESTAMP - INTERVAL '4 hours 30 minutes'),
(5, 2, 'PROJECT_DELAYED', 'PROJECT', 2, 'Project status updated to Delayed', 'BioLabs BSL-2 Climate Control pending damper delivery from tier-1 vendor', 'clock', 'warning', CURRENT_TIMESTAMP - INTERVAL '6 hours'),
(6, 1, 'PAYMENT_RECEIVED', 'PAYMENT', 4, 'Payment received ($96,000)', 'Solstice Hospitality Group cleared final retention payment via Stripe', 'credit-card', 'success', CURRENT_TIMESTAMP - INTERVAL '1 day');

SELECT setval('activities_id_seq', (SELECT MAX(id) FROM activities));
