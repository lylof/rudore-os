import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';
import { mapUserFromDB } from '../../../../lib/utils/db-mapper';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL [api/debug/promote]: JWT_SECRET environment variable is missing or too weak.');
}

export async function POST() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
    }

    try {
        const secretUint8 = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretUint8);

        // Mise à jour de l'utilisateur pour devenir admin
        // On lui assigne aussi le access_role_id 'admin' pour la cohérence avec le schéma
        const updateResult = await query(
            'UPDATE members SET is_admin = true, access_role_id = $1 WHERE id = $2 RETURNING *',
            ['admin', payload.id]
        );

        const updatedUser = updateResult.rows[0];

        if (!updatedUser) {
            return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
        }

        console.log(`[DEBUG PROMOTE] User ${payload.id} promoted to admin.`);

        return NextResponse.json({
            user: mapUserFromDB(updatedUser),
            message: 'Promotion réussie'
        });
    } catch (error) {
        console.error('[DEBUG PROMOTE] Error:', error);
        return NextResponse.json({ message: 'Token invalide ou erreur serveur' }, { status: 401 });
    }
}
