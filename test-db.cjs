require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { z } = require('zod');

const dbWalletSchema = z.object({
    totalPoints: z.number().default(0),
    currentMonthPoints: z.number().default(0),
    equityValue: z.number().default(0)
}).default({ totalPoints: 0, currentMonthPoints: 0, equityValue: 0 });

const dbMemberSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string().email(),
    role: z.string().default(''),
    department: z.any(),
    avatar_initials: z.string().default(''),
    level: z.any(),
    skills: z.array(z.string()).default([]),
    availability: z.number().default(0),
    wallet: dbWalletSchema,
    is_lead: z.boolean().default(false),
    is_admin: z.boolean().default(false),
    access_role_id: z.string().nullable().optional(),
    joined_at: z.string().or(z.date()).optional(),
    bio: z.string().nullable().optional(),
    academic_role: z.string().nullable().optional(),
    external_role: z.string().nullable().optional(),
    has_lpt: z.boolean().default(false),
    permissions: z.array(z.string()).default([])
});

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const res = await pool.query('SELECT * FROM members ORDER BY name ASC');
    console.log("Raw row 0:", res.rows[0]);
    try {
        dbMemberSchema.parse(res.rows[0]);
        console.log("Parse success!");
    } catch (e) {
        console.error("Parse Error:", e.errors || e);
    }

    const resProjects = await pool.query('SELECT * FROM projects');
    console.log("Projects:", resProjects.rows[0]);
    process.exit(0);
}

main();
