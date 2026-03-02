import { NextResponse } from 'next/server';
import { query } from '../../../lib/db';

export async function GET() {
    try {
        const membersRes = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'members'");
        const projectsRes = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'projects'");
        const kanbanRes = await query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'kanban_tasks'");

        return NextResponse.json({
            members: membersRes.rows,
            projects: projectsRes.rows,
            kanban: kanbanRes.rows,
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
