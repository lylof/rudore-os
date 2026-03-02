import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';
import { mapUserFromDB } from '../../../../lib/utils/db-mapper';

export async function GET(request: Request) {
    // 1. AUTHORIZATION via Middleware Headers
    // Le middleware garantit l'authenticité de l'utilisateur. Plus besoin de décoder le JWT ici.
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. VERIFICATION DES PRIVILÈGES (RBAC)
        const adminCheck = await query('SELECT is_admin FROM members WHERE id = $1', [userId]);
        const currentUser = adminCheck.rows[0];

        if (!currentUser || !currentUser.is_admin) {
            console.warn(`[SECURITY] DoS/Access attempt by non-admin user ID: ${userId}`);
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // 3. PAGINATION OBLIGATOIRE (Mitigation DoS/OOM)
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limitParam = parseInt(searchParams.get('limit') || '50', 10);

        // Bloquer les requêtes abusives (ex: limit=10000)
        const limit = Math.min(Math.max(1, limitParam), 100);
        const offset = (page - 1) * limit;

        // Fetch users paginated and the total count concurrently
        const [usersResult, countResult] = await Promise.all([
            query('SELECT * FROM members ORDER BY name ASC LIMIT $1 OFFSET $2', [limit, offset]),
            query('SELECT COUNT(*) FROM members')
        ]);

        const totalUsers = parseInt(countResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalUsers / limit);

        const safeUsers = usersResult.rows.map(u => mapUserFromDB(u));

        // 4. RÉPONSE RICHE (Pagination Metadata)
        return NextResponse.json({
            users: safeUsers,
            pagination: {
                total: totalUsers,
                page,
                limit,
                totalPages,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('[ADMIN USERS] Database error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
