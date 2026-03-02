import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { mapTaskFromDB } from '@/lib/utils/db-mapper';

export async function GET(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const result = await query('SELECT * FROM kanban_tasks ORDER BY created_at DESC');
        const tasks = result.rows.map(mapTaskFromDB);
        return NextResponse.json(tasks);
    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const { id, title, description, projectId, assigneeId, status, complexity, tags, deadline } = body;

        // CRITICAL: JSONB columns require JSON.stringify — pg driver serializes JS arrays as PG arrays ({a,b}) not JSON (["a","b"])
        const result = await query(
            `INSERT INTO kanban_tasks (
                id, title, description, project_id, assignee_id, status, complexity, tags, deadline
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9) RETURNING *`,
            [id, title, description, projectId, assigneeId, status, complexity, JSON.stringify(tags || []), deadline]
        );

        return NextResponse.json(mapTaskFromDB(result.rows[0]), { status: 201 });
    } catch (error: any) {
        console.error('Error creating task:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await req.json();
        const { id, ...patch } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
        }

        // Dynamic update query
        const fields = Object.keys(patch).filter(key => key !== 'id');
        if (fields.length === 0) {
            return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
        }

        const setClause = fields.map((field, i) => {
            const dbField = field === 'projectId' ? 'project_id' :
                field === 'assigneeId' ? 'assignee_id' :
                    field === 'qualityRating' ? 'quality_rating' :
                        field.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            return `${dbField} = $${i + 2}`;
        }).join(', ');

        const values = fields.map(field => {
            // JSONB fields must be stringified before being sent to pg
            if (field === 'tags' && Array.isArray(patch[field])) {
                return JSON.stringify(patch[field]);
            }
            return patch[field];
        });

        const result = await query(
            `UPDATE kanban_tasks SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Tâche non trouvée' }, { status: 404 });
        }

        return NextResponse.json(mapTaskFromDB(result.rows[0]));
    } catch (error: any) {
        console.error('Error updating task:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const userId = req.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID manquant' }, { status: 400 });
        }

        await query('DELETE FROM kanban_tasks WHERE id = $1', [id]);
        return NextResponse.json({ message: 'Tâche supprimée' });
    } catch (error: any) {
        console.error('Error deleting task:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
