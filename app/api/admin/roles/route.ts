import { NextResponse } from 'next/server';
import { query } from '../../../../lib/db';

export async function GET(request: Request) {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const result = await query('SELECT * FROM access_roles ORDER BY name ASC');
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('[ADMIN ROLES] Fetch roles error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const userId = request.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        // VERIFICATION DES PRIVILÈGES (RBAC)
        const adminCheck = await query('SELECT is_admin FROM members WHERE id = $1', [userId]);
        if (!adminCheck.rows[0]?.is_admin) {
            console.warn(`[SECURITY] Unauthorized POST roles attempt by user ID: ${userId}`);
            return NextResponse.json({ message: 'Forbidden: Admin access required' }, { status: 403 });
        }

        const { id, name, description, permissions } = await request.json();

        const result = await query(
            'INSERT INTO access_roles (id, name, description, permissions) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, name, description, JSON.stringify(permissions)]
        );

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('[ADMIN ROLES] Create role error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
