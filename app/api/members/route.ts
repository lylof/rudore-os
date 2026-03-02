import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';
import { mapUserFromDB } from '../../../lib/utils/db-mapper';

export async function GET(request: Request) {
    // 1. VERIFICATION AUTHORIZATION (Middleware checked via Headers)
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Fetch all members. No pagination for now as this is used for dropdowns/general pool.
        // We order by name.
        const res = await query('SELECT * FROM members ORDER BY name ASC');

        // 2. SANITIZATION STRICTE
        // We use mapUserFromDB which relies on dbMemberSchema to strip out any unexpected fields.
        // Sensitive fields like password_hash shouldn't even exist in the 'members' table (usually in 'users' or 'auth' table),
        // but it's a double safeguard.
        const safeMembers = res.rows.map(row => mapUserFromDB(row)).filter(Boolean);

        return NextResponse.json({ members: safeMembers });
    } catch (error) {
        console.error('[API MEMBERS] Error fetching members:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
