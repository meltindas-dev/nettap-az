-- PostgreSQL Database Schema for NetTap

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Users Table
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'isp', 'user')),
  isp_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_isp_id ON users(isp_id);

-- ============================================
-- ISPs Table
-- ============================================
CREATE TABLE isps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(500),
  description TEXT,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  website VARCHAR(500),
  priority_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_isps_is_active ON isps(is_active);
CREATE INDEX idx_isps_priority_score ON isps(priority_score DESC);

-- ============================================
-- Cities Table
-- ============================================
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  name_az VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_cities_is_active ON cities(is_active);

-- ============================================
-- Districts Table
-- ============================================
CREATE TABLE districts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  name_az VARCHAR(255) NOT NULL,
  name_en VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_districts_city_id ON districts(city_id);
CREATE INDEX idx_districts_is_active ON districts(is_active);

-- ============================================
-- Tariffs Table
-- ============================================
CREATE TABLE tariffs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  isp_id UUID NOT NULL REFERENCES isps(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  technology VARCHAR(20) NOT NULL CHECK (technology IN ('fiber', 'adsl', 'vdsl', 'wireless', '4.5g')),
  speed_mbps INTEGER NOT NULL,
  upload_speed_mbps INTEGER,
  price_monthly DECIMAL(10, 2) NOT NULL,
  contract_length_months INTEGER DEFAULT 0,
  data_limit_gb INTEGER,
  
  -- Campaign flags (stored as JSONB for flexibility)
  campaigns JSONB DEFAULT '{"freeModem": false, "freeInstallation": false}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tariffs_isp_id ON tariffs(isp_id);
CREATE INDEX idx_tariffs_technology ON tariffs(technology);
CREATE INDEX idx_tariffs_speed_mbps ON tariffs(speed_mbps);
CREATE INDEX idx_tariffs_price_monthly ON tariffs(price_monthly);
CREATE INDEX idx_tariffs_is_active ON tariffs(is_active);
CREATE INDEX idx_tariffs_campaigns ON tariffs USING GIN (campaigns);

-- ============================================
-- Tariff Districts (Many-to-Many)
-- ============================================
CREATE TABLE tariff_districts (
  tariff_id UUID NOT NULL REFERENCES tariffs(id) ON DELETE CASCADE,
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  PRIMARY KEY (tariff_id, district_id)
);

CREATE INDEX idx_tariff_districts_district_id ON tariff_districts(district_id);

-- ============================================
-- Leads Table
-- ============================================
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status VARCHAR(30) NOT NULL CHECK (status IN ('new', 'contacted', 'qualified', 'assigned_to_isp', 'in_progress', 'converted', 'rejected', 'cancelled')),
  source VARCHAR(30) NOT NULL CHECK (source IN ('comparison', 'direct', 'referral', 'campaign')),
  
  -- User information
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  
  -- Location
  city_id UUID NOT NULL REFERENCES cities(id),
  district_id UUID NOT NULL REFERENCES districts(id),
  address TEXT,
  
  -- Tariff snapshot (stored as JSONB)
  tariff_snapshot JSONB NOT NULL,
  
  -- Assignment
  assigned_isp_id UUID REFERENCES isps(id),
  assigned_at TIMESTAMP WITH TIME ZONE,
  
  -- Tracking
  notes TEXT,
  outcome_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  converted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_assigned_isp_id ON leads(assigned_isp_id);
CREATE INDEX idx_leads_city_id ON leads(city_id);
CREATE INDEX idx_leads_district_id ON leads(district_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_phone ON leads(phone);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_isps_updated_at BEFORE UPDATE ON isps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tariffs_updated_at BEFORE UPDATE ON tariffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Seed Data
-- ============================================

-- Insert Cities
INSERT INTO cities (id, name, name_az, name_en, is_active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Bakı', 'Bakı', 'Baku', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'Gəncə', 'Gəncə', 'Ganja', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'Sumqayıt', 'Sumqayıt', 'Sumgayit', true);

-- Insert Districts
INSERT INTO districts (id, city_id, name, name_az, name_en, is_active) VALUES
  ('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Nəsimi', 'Nəsimi', 'Nasimi', true),
  ('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Yasamal', 'Yasamal', 'Yasamal', true),
  ('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Nərimanov', 'Nərimanov', 'Narimanov', true),
  ('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Sabunçu', 'Sabunçu', 'Sabunchu', true),
  ('660e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', 'Kəpəz', 'Kəpəz', 'Kapaz', true),
  ('660e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440002', 'Nizami', 'Nizami', 'Nizami', true);

-- Insert ISPs
INSERT INTO isps (id, name, logo, description, contact_email, contact_phone, website, priority_score, is_active) VALUES
  ('770e8400-e29b-41d4-a716-446655440001', 'AzerTelecom', '/logos/azertelecom.png', 'Leading fiber internet provider', 'sales@azertelecom.az', '+994124901000', 'https://azertelecom.az', 95, true),
  ('770e8400-e29b-41d4-a716-446655440002', 'Baktelecom', '/logos/baktelecom.png', 'Reliable ADSL and VDSL services', 'info@baktelecom.az', '+994125980000', 'https://baktelecom.az', 90, true),
  ('770e8400-e29b-41d4-a716-446655440003', 'Naxtel', '/logos/naxtel.png', '4.5G wireless internet solutions', 'support@naxtel.az', '+994124040000', 'https://naxtel.az', 85, true);

-- Insert Users
INSERT INTO users (id, email, password_hash, role, isp_id, is_active) VALUES
  ('aa0e8400-e29b-41d4-a716-446655440001', 'admin@nettap.az', '$2b$10$FbBkU39xQPK3KPac1jRYbOXRcrAfD5HetLtqkHur.xW4VAz8VeTly', 'admin', NULL, true),
  ('aa0e8400-e29b-41d4-a716-446655440002', 'azertelecom@nettap.az', '$2b$10$CJ1rDWnT7BYpIE24Hfe5iO2pI8tv7gNDQEtQS13w8/zjzxFb/4k1q', 'isp', '770e8400-e29b-41d4-a716-446655440001', true),
  ('aa0e8400-e29b-41d4-a716-446655440003', 'baktelecom@nettap.az', '$2b$10$CJ1rDWnT7BYpIE24Hfe5iO2pI8tv7gNDQEtQS13w8/zjzxFb/4k1q', 'isp', '770e8400-e29b-41d4-a716-446655440002', true);
