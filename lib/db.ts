import { Pool } from '@neondatabase/serverless';

// Neon serverless connection pool optimized for Vercel/Next.js
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // SSL is implicitly true for Neon serverless, no extra config needed
});

export const query = async (text: string, params?: any[]) => {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;

    // Conditionnel pour éviter le spam logs en production (OOM memory leak prevention)
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[DB Query] ${duration}ms | Rows: ${res.rowCount} | Text: ${text}`);
    }

    return res;
};

export const getClient = () => pool.connect();

export default {
    query,
    getClient,
};
