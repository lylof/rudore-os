import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { query } from './lib/db';

async function run() {
    try {
        const res = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'members'");
        console.log('MEMBERS COLUMNS:');
        console.log(JSON.stringify(res.rows, null, 2));

        const resRoles = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'access_roles'");
        console.log('ACCESS_ROLES COLUMNS:');
        console.log(JSON.stringify(resRoles.rows, null, 2));
    } catch (e) {
        console.error('FAILED TO FETCH SCHEMA:', e);
    }
}

run();
