import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mapProjectFromDB } from '@/lib/utils/db-mapper';

export async function GET(req: NextRequest) {
    // 1. AUTHORIZATION via Middleware Headers
    const userId = req.headers.get('x-user-id');

    if (!userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        // Fetch projects
        // We do not join with members anymore here because the frontend will fetch members 
        // via /api/members and map them by lead_id natively as it did with MOCK_MEMBERS.
        // We order by name to keep consistency with the mock's alphabetical look.
        const result = await query(
            `SELECT * FROM projects ORDER BY name ASC`
        );

        // 2. MAPPING AND SANITIZATION
        const projects = result.rows.map(mapProjectFromDB);

        return NextResponse.json({ projects });
    } catch (error: any) {
        console.error('[API PROJECTS] Error fetching projects:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    // 1. AUTHORIZATION & RBAC via Middleware Headers
    const userId = req.headers.get('x-user-id');
    const userRole = req.headers.get('x-user-role');

    if (!userId) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    try {
        // Double check admin privilege on creation
        const adminCheck = await query('SELECT is_admin FROM members WHERE id = $1', [userId]);
        const isUserAdmin = adminCheck.rows[0]?.is_admin;

        if (!isUserAdmin) {
            return NextResponse.json({ error: 'Accès restreint aux administrateurs' }, { status: 403 });
        }

        const body = await req.json();
        const { id, name, type, status, leadId, deadline, description, financials } = body;

        if (!id || !name || !type || !status) {
            return NextResponse.json({ error: 'Champs obligatoires manquants' }, { status: 400 });
        }

        await query(
            `INSERT INTO projects (
                id, name, type, status, lead_id, deadline, description, 
                financial_budget, financial_spent, financial_revenue, equity_pool
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [
                id, name, type, status, leadId, deadline, description,
                financials?.budget || 0,
                financials?.spent || 0,
                financials?.revenue || 0,
                financials?.equityPool || 0
            ]
        );

        return NextResponse.json({ message: 'Projet créé avec succès', id }, { status: 201 });
    } catch (error: any) {
        console.error('[API PROJECTS] Error creating project:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
