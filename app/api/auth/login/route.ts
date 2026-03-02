import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';
import { mapUserFromDB } from '../../../../lib/utils/db-mapper';

// 1. FAIL-FAST SECURITE
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL [login]: JWT_SECRET environment variable is missing or too weak (min 32 chars).');
}
const secretUint8 = new TextEncoder().encode(JWT_SECRET);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = body?.email;
        const password = body?.password;

        if (!email || !password) {
            return NextResponse.json({ message: 'Missing credentials' }, { status: 400 });
        }

        const result = await query('SELECT * FROM members WHERE email = $1', [email]);
        const user = result.rows[0];

        // 2. MITIGATION TIMING ATTACK (User Enumeration)
        // If user doesn't exist, we still hash a dummy password to equalize response times
        const isValidPassword = user
            ? await bcrypt.compare(password, user.password_hash)
            : await bcrypt.compare(password, '$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'); // Dummy hash

        if (!user || !isValidPassword) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // 3. STRICT JWT CLAIMS (Injection du rôle pour le middleware)
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role // CRITICAL: Middleware relies on this
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secretUint8);

        // 4. HTTP-ONLY COOKIE
        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 // 24 hours
        });

        // 5. DATA WHITELISTING (DTO)
        // Ne jamais renvoyer le `password_hash` ni laisser Next le sérialiser par erreur.
        const safeUserDTO = mapUserFromDB(user);

        return NextResponse.json({
            message: 'Login successful',
            user: safeUserDTO
        }, { status: 200 });

    } catch (error) {
        console.error('[LOGIN ERROR] Failed authentication attempt:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
