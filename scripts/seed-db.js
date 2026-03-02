/**
 * RUDORE OS - Database Seeding Script
 * Run this to populate your Neon database with initial mock data.
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
});

async function seed() {
    console.log('Seeding database...');

    try {
        // 1. Roles
        await pool.query(`
      INSERT INTO access_roles (id, name, description, permissions, is_system) VALUES
      ('admin', 'Administrateur', 'Accès complet au système', '{"VIEW_DASHBOARD", "VIEW_STUDIO", "VIEW_AGENCY", "VIEW_SQUADS", "VIEW_TALENTS", "VIEW_CONTRIBUTIONS", "MANAGE_SETTINGS", "MANAGE_ROLES", "MANAGE_USERS"}', true),
      ('builder', 'Builder', 'Accès aux outils de production', '{"VIEW_DASHBOARD", "VIEW_STUDIO", "VIEW_AGENCY", "VIEW_SQUADS", "VIEW_TALENTS", "KANBAN"}', true),
      ('viewer', 'Visiteur', 'Accès lecture seule', '{"VIEW_DASHBOARD"}', true)
      ON CONFLICT (id) DO NOTHING;
    `);

        // 2. Members from MOCK_MEMBERS
        const members = [
            { id: crypto.randomUUID(), name: 'Victor', role: 'Lead Product', dep: 'Design', initials: 'VI', level: 'Expert', email: 'victor@rudore.com' },
            { id: crypto.randomUUID(), name: 'Fellow A', role: 'Fullstack Dev', dep: 'Tech & Dév', initials: 'FA', level: 'Junior', email: 'fellowa@rudore.com' },
            { id: crypto.randomUUID(), name: 'Lionel', role: 'CTO / Tech Lead', dep: 'Tech & Dév', initials: 'LI', level: 'Expert', email: 'lionel@rudore.com' }
        ];

        for (const m of members) {
            await pool.query(`
        INSERT INTO members (id, name, email, role, department, avatar_initials, level, joined_at, is_admin, access_role_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
      `, [m.id, m.name, m.email, m.role, m.dep, m.initials, m.level, m.name === 'Lionel', m.name === 'Lionel' ? 'admin' : 'builder']);
        }

        // 3. Projects
        const projects = [
            { id: crypto.randomUUID(), name: 'DoAsi', type: 'STUDIO', status: 'Planification', budget: 5000000, equity: 15 },
            { id: crypto.randomUUID(), name: 'KOODI', type: 'STUDIO', status: 'Développement', budget: 15000000, equity: 25 },
            { id: crypto.randomUUID(), name: 'Banque Atlantique', type: 'AGENCY', status: 'Actif', budget: 25000000, equity: 0 }
        ];

        for (const p of projects) {
            await pool.query(
                'INSERT INTO projects (id, name, type, status, financial_budget, equity_pool) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
                [p.id, p.name, p.type, p.status, p.budget, p.equity]
            );
        }

        // 4. Default Points Config
        // ... (rest updated to use pool.query)
        await pool.query('UPDATE points_config SET is_active = false');
        await pool.query(
            'INSERT INTO points_config (config_json, is_active) VALUES ($1, true)',
            [JSON.stringify(defaultConfig)]
        );

        // 5. Kanban Tasks
        const tasks = [
            { id: crypto.randomUUID(), title: 'Design System V2', projectId: 'p2', assigneeId: 'm1', status: 'VALIDATED', complexity: 'COMPLEX' },
            { id: crypto.randomUUID(), title: 'API Gateway Setup', projectId: 'p2', assigneeId: 'm4', status: 'VALIDATED', complexity: 'VERY_COMPLEX' },
            { id: crypto.randomUUID(), title: 'Landing Page Copy', projectId: 'p1', assigneeId: 'm3', status: 'REVIEW', complexity: 'SIMPLE' }
        ];

        for (const t of tasks) {
            await pool.query(
                'INSERT INTO kanban_tasks (id, title, project_id, assignee_id, status, complexity) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING',
                [t.id, t.title, t.projectId, t.assigneeId, t.status, t.complexity]
            );
        }

        console.log('Seeding completed successfully.');
    } catch (err) {
        console.error('Seeding failed:', err);
    } finally {
        await pool.end();
    }
}

seed();
