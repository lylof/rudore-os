import { NextResponse } from 'next/server';
import { query } from '../../../../../lib/db';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // VERIFICATION DES PRIVILÈGES (RBAC)
        const adminCheck = await query('SELECT is_admin FROM members WHERE id = $1', [userId]);
        if (!adminCheck.rows[0]?.is_admin) {
            console.warn(`[SECURITY] Unauthorized DELETE role attempt by user ID: ${userId}`);
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }

        // Check if the role is a system role (cannot be deleted)
        const roleCheck = await query('SELECT is_system FROM access_roles WHERE id = $1', [id]);
        if (roleCheck.rows.length === 0) {
            return NextResponse.json({ message: 'Role not found' }, { status: 404 });
        }
        if (roleCheck.rows[0].is_system) {
            return NextResponse.json({ message: 'Cannot delete a system role' }, { status: 400 });
        }

        // Delete the role
        await query('DELETE FROM access_roles WHERE id = $1', [id]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[ADMIN ROLES] Delete role error:', error);
        // Handle specific constraint violations (e.g. users still using this role)
        if ((error as any).code === '23503') {
            return NextResponse.json({ message: 'Cannot delete: Role is currently assigned to users' }, { status: 409 });
        }
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
