-- RUDORE OS - Database Schema (PostgreSQL)

-- 1. Access Roles & Permissions
CREATE TABLE IF NOT EXISTS access_roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    is_system BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Members (Users)
CREATE TABLE IF NOT EXISTS members (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT, -- Business role (Lead, Dev, etc.)
    department TEXT, -- Enum-like string
    level TEXT, -- Enum-like string (JUNIOR, SENIOR, etc.)
    avatar_initials TEXT,
    availability INTEGER DEFAULT 100,
    is_lead BOOLEAN DEFAULT false,
    is_admin BOOLEAN DEFAULT false,
    access_role_id TEXT REFERENCES access_roles(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    bio TEXT,
    academic_role TEXT,
    external_role TEXT,
    has_lpt BOOLEAN DEFAULT false,
    skills JSONB DEFAULT '[]',
    wallet JSONB DEFAULT '{"totalPoints": 0, "currentMonthPoints": 0, "equityValue": 0}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Projects
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'STUDIO' or 'AGENCY'
    status TEXT NOT NULL,
    lead_id TEXT REFERENCES members(id),
    deadline DATE,
    description TEXT,
    financial_budget NUMERIC(15, 2) DEFAULT 0,
    financial_spent NUMERIC(15, 2) DEFAULT 0,
    financial_revenue NUMERIC(15, 2) DEFAULT 0,
    equity_pool NUMERIC(5, 2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.5 Project Squad Members (Assignments)
CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
    role_at_time TEXT, -- Optional: role when assigned
    PRIMARY KEY (project_id, member_id)
);


-- 4. Project Roadmap
CREATE TABLE IF NOT EXISTS project_roadmap (
    id SERIAL PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    status TEXT NOT NULL, -- 'TODO', 'IN_PROGRESS', 'DONE'
    date_label TEXT,
    sort_order INTEGER DEFAULT 0
);

-- 5. Kanban Tasks
CREATE TABLE IF NOT EXISTS kanban_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    project_id TEXT, -- Can be linked to projects(id)
    assignee_id TEXT REFERENCES members(id),
    status TEXT NOT NULL,
    complexity TEXT NOT NULL,
    quality_rating TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deadline DATE,
    tags TEXT[]
);

-- 6. Points Configuration
CREATE TABLE IF NOT EXISTS points_config (
    id SERIAL PRIMARY KEY,
    config_json JSONB NOT NULL, -- Stores multipliers and thresholds
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initial Roles Data
INSERT INTO access_roles (id, name, description, permissions, is_system) VALUES
('admin', 'Administrateur', 'Accès complet au système', '["VIEW_DASHBOARD", "VIEW_STUDIO", "VIEW_AGENCY", "VIEW_SQUADS", "VIEW_TALENTS", "VIEW_CONTRIBUTIONS", "MANAGE_SETTINGS", "MANAGE_ROLES", "MANAGE_USERS"]'::jsonb, true),
('builder', 'Builder', 'Accès aux outils de production', '["VIEW_DASHBOARD", "VIEW_STUDIO", "VIEW_AGENCY", "VIEW_SQUADS", "VIEW_TALENTS", "KANBAN"]'::jsonb, true),
('viewer', 'Visiteur', 'Accès lecture seule', '["VIEW_DASHBOARD"]'::jsonb, true)
ON CONFLICT (id) DO NOTHING;
