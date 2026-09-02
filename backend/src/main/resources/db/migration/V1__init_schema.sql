-- V1: Initial CRM Database Schema

-- 1. Users & Roles
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(180) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'STAFF',
    avatar_url VARCHAR(500),
    title VARCHAR(100),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    company VARCHAR(150),
    email VARCHAR(180) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    total_value NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, LEAD
    customer_since DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Leads
CREATE TABLE leads (
    id BIGSERIAL PRIMARY KEY,
    lead_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(180),
    phone VARCHAR(50),
    company VARCHAR(150),
    source VARCHAR(100), -- Website, Referral, Cold Outreach, Partner, Exhibition
    location VARCHAR(200),
    requirement TEXT,
    estimated_value NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'NEW', -- NEW, CONTACTED, QUALIFIED, SURVEY_SCHEDULED, QUOTE_SENT, WON, LOST
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    last_contacted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Site Surveys
CREATE TABLE site_surveys (
    id BIGSERIAL PRIMARY KEY,
    survey_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
    address VARCHAR(255) NOT NULL,
    survey_date DATE NOT NULL,
    survey_time VARCHAR(50),
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED', -- SCHEDULED, COMPLETED, CANCELLED
    measurements TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Quotes
CREATE TABLE quotes (
    id BIGSERIAL PRIMARY KEY,
    quote_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    lead_id BIGINT REFERENCES leads(id) ON DELETE SET NULL,
    project_type VARCHAR(100) NOT NULL,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    margin NUMERIC(12, 2) GENERATED ALWAYS AS (amount - cost) STORED,
    margin_percentage NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE WHEN amount > 0 THEN ((amount - cost) / amount) * 100 ELSE 0 END
    ) STORED,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED
    valid_until DATE,
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Projects
CREATE TABLE projects (
    id BIGSERIAL PRIMARY KEY,
    project_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    quote_id BIGINT REFERENCES quotes(id) ON DELETE SET NULL,
    project_name VARCHAR(150) NOT NULL,
    location VARCHAR(200),
    start_date DATE,
    expected_completion DATE,
    actual_completion DATE,
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PLANNED', -- PLANNED, IN_PROGRESS, DELAYED, COMPLETED, CANCELLED
    budget NUMERIC(12, 2) DEFAULT 0.00,
    progress_percentage INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Payments
CREATE TABLE payments (
    id BIGSERIAL PRIMARY KEY,
    payment_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_date DATE,
    due_date DATE NOT NULL,
    payment_method VARCHAR(50), -- Bank Transfer, Stripe, Cheque, Wire, Credit Card
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, DUE, PARTIALLY_PAID, PAID, OVERDUE
    reference_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Service & Warranty Requests
CREATE TABLE service_requests (
    id BIGSERIAL PRIMARY KEY,
    ticket_code VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT REFERENCES customers(id) ON DELETE CASCADE,
    project_id BIGINT REFERENCES projects(id) ON DELETE SET NULL,
    issue VARCHAR(200) NOT NULL,
    description TEXT,
    priority VARCHAR(50) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, WAITING, RESOLVED, CLOSED
    assigned_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    due_date DATE,
    resolution TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. Activity Log
CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- LEAD_CREATED, QUOTE_VIEWED, PAYMENT_RECEIVED, SURVEY_COMPLETED, PROJECT_DELAYED, CUSTOMER_ONBOARDED, STATUS_CHANGED
    entity_type VARCHAR(50) NOT NULL, -- LEAD, QUOTE, PAYMENT, SURVEY, PROJECT, CUSTOMER, SERVICE
    entity_id BIGINT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'activity',
    badge_type VARCHAR(50) DEFAULT 'neutral', -- success, warning, danger, info, neutral
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for rapid querying & dashboard metrics
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_user_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_due_date ON payments(due_date);
CREATE INDEX idx_surveys_status ON site_surveys(status);
CREATE INDEX idx_surveys_date ON site_surveys(survey_date);
CREATE INDEX idx_activities_created ON activities(created_at DESC);
