import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';
import { mapUserFromDB } from '../../../../lib/utils/db-mapper';

// 1. FAIL-FAST SECURITE
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL [auth/me]: JWT_SECRET environment variable is missing or too weak (min 32 chars).');
}

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const secretUint8 = new TextEncoder().encode(JWT_SECRET);
        const { payload } = await jwtVerify(token, secretUint8);

        // Fetch user from database
        const result = await query('SELECT * FROM members WHERE id = $1', [payload.id]);
        const user = result.rows[0];

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Return validated DTO
        return NextResponse.json({ user: mapUserFromDB(user) });
    } catch (error) {
        console.error('[AUTH ME] Request rejected:', error);
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
}
