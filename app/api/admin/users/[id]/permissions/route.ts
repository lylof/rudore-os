import { NextResponse } from 'next/server';
import { query } from '../../../../../../lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // 1. AUTHORIZATION via Middleware Headers
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. VERIFICATION DES PRIVILÈGES (RBAC)
        const adminCheck = await query('SELECT is_admin FROM members WHERE id = $1', [userId]);
        const currentUser = adminCheck.rows[0];

        if (!currentUser || !currentUser.is_admin) {
            console.warn(`[SECURITY] Unauthorized permission change attempt by non-admin user ID: ${userId}`);
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { isAdmin, permissions, accessRoleId } = await request.json();

        // 3. Update user in PostgreSQL safely
        const updateQuery = `
            UPDATE members 
            SET is_admin = COALESCE($1, is_admin),
                permissions = COALESCE($2, permissions),
                access_role_id = COALESCE($3, access_role_id)
            WHERE id = $4
            RETURNING *
        `;

        const result = await query(updateQuery, [isAdmin, permissions, accessRoleId, id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        const updatedUser = result.rows[0];

        // Ensure sensitive data is not leaked
        const cleanUser = { ...updatedUser, password_hash: undefined };
        return NextResponse.json({ user: cleanUser });
    } catch (error) {
        console.error('[ADMIN PERMISSIONS] Update error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
