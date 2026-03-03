import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await verifyAuth();
        if (!user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const result = await query('SELECT config_json FROM points_config WHERE is_active = true LIMIT 1');

        if (result.rows.length === 0) {
            return NextResponse.json(null);
        }

        return NextResponse.json(result.rows[0].config_json);
    } catch (error: any) {
        console.error('Error fetching config:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await verifyAuth();
        if (!user || !user.isAdmin) {
            return NextResponse.json({ error: 'Accès restreint aux administrateurs' }, { status: 403 });
        }

        const body = await req.json();

        // Deactivate previous active configs
        await query('UPDATE points_config SET is_active = false');

        // Insert new active config
        const result = await query(
            'INSERT INTO points_config (config_json, is_active) VALUES ($1, true) RETURNING config_json',
            [JSON.stringify(body)]
        );

        return NextResponse.json(result.rows[0].config_json);
    } catch (error: any) {
        console.error('Error updating config:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
