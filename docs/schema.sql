-- PropPilot AI Database Schema
-- PostgreSQL + Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enum Types
CREATE TYPE lead_source AS ENUM ('whatsapp', 'facebook', 'instagram', 'magicbricks', 'housing', 'website', 'referral', 'other');
CREATE TYPE lead_status AS ENUM ('new', 'qualified', 'contacted', 'nurturing', 'site_visit_scheduled', 'site_visit_completed', 'negotiation', 'booked', 'lost', 'archived');
CREATE TYPE lead_priority AS ENUM ('hot', 'warm', 'cold');
CREATE TYPE property_type AS ENUM ('apartment', 'villa', 'plot', 'commercial', 'office');
CREATE TYPE followup_channel AS ENUM ('whatsapp', 'email', 'sms', 'call', 'internal_task');
CREATE TYPE followup_status AS ENUM ('pending', 'sent', 'delivered', 'read', 'replied', 'failed', 'skipped');
CREATE TYPE sequence_status AS ENUM ('active', 'paused', 'completed', 'stopped', 'cancelled');
CREATE TYPE appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
CREATE TYPE activity_type AS ENUM ('lead_created', 'lead_qualified', 'lead_scored', 'property_recommended', 'followup_sent', 'followup_replied', 'appointment_scheduled', 'appointment_completed', 'lead_converted', 'lead_lost', 'note_added', 'task_created', 'task_completed');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(500),
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'sales_executive',
    is_active BOOLEAN DEFAULT true,
    is_superuser BOOLEAN DEFAULT false,
    supabase_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_supabase_id ON users(supabase_id);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    address TEXT,
    price DECIMAL(12,2) NOT NULL,
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqft INTEGER,
    property_type property_type NOT NULL,
    description TEXT,
    amenities JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    brochure_url VARCHAR(500),
    video_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    builder_name VARCHAR(255),
    possession_date TIMESTAMPTZ,
    rera_number VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_active ON properties(is_active);
CREATE INDEX idx_properties_name ON properties(name);

-- Leads table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    location VARCHAR(255),
    property_type property_type,
    timeline VARCHAR(100),
    financing_required BOOLEAN DEFAULT false,
    intent TEXT,
    source lead_source DEFAULT 'other',
    lead_score INTEGER DEFAULT 0,
    priority lead_priority DEFAULT 'cold',
    status lead_status DEFAULT 'new',
    assigned_to UUID REFERENCES users(id),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    qualified_at TIMESTAMPTZ,
    last_contacted_at TIMESTAMPTZ
);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_location ON leads(location);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);

-- Property Recommendations join table
CREATE TABLE property_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    match_score INTEGER DEFAULT 0,
    reason TEXT,
    is_viewed BOOLEAN DEFAULT false,
    is_shortlisted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id, property_id)
);
CREATE INDEX idx_property_recommendations_lead ON property_recommendations(lead_id);

-- Follow-up Sequences
CREATE TABLE followup_sequences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    name VARCHAR(255),
    status sequence_status DEFAULT 'active',
    current_step INTEGER DEFAULT 0,
    total_steps INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    stopped_at TIMESTAMPTZ,
    stop_reason VARCHAR(255),
    metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_followup_sequences_lead ON followup_sequences(lead_id);
CREATE INDEX idx_followup_sequences_status ON followup_sequences(status);

-- Follow-up Steps
CREATE TABLE followup_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_id UUID NOT NULL REFERENCES followup_sequences(id) ON DELETE CASCADE,
    step_order INTEGER NOT NULL,
    channel followup_channel NOT NULL,
    message_template TEXT,
    message_content TEXT,
    delay_hours INTEGER DEFAULT 0,
    delay_days INTEGER DEFAULT 0,
    status followup_status DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    error_message TEXT,
    external_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'
);
CREATE INDEX idx_followup_steps_sequence ON followup_steps(sequence_id);
CREATE INDEX idx_followup_steps_status ON followup_steps(status);

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    appointment_type VARCHAR(50) DEFAULT 'site_visit',
    status appointment_status DEFAULT 'scheduled',
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    location VARCHAR(500),
    meeting_link VARCHAR(500),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX idx_appointments_lead ON appointments(lead_id);
CREATE INDEX idx_appointments_scheduled ON appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    activity_type activity_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_activities_lead ON activities(lead_id);
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_created ON activities(created_at);

-- Messages
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    channel followup_channel NOT NULL,
    direction VARCHAR(20) DEFAULT 'outbound',
    content TEXT NOT NULL,
    template_id VARCHAR(255),
    status followup_status DEFAULT 'pending',
    external_id VARCHAR(255),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_created ON messages(created_at);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
