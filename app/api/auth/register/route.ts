import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { query } from '../../../../lib/db';
import { mapUserFromDB } from '../../../../lib/utils/db-mapper';

export async function POST(request: Request) {
    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET || JWT_SECRET.length < 32) {
        throw new Error("CRITICAL: JWT_SECRET is not defined or too weak (min 32 chars)");
    }
    const secret = new TextEncoder().encode(JWT_SECRET);

    try {
        const { email, password, name, role, academicRole, bio } = await request.json();

        // Check if user exists
        const userExists = await query('SELECT id FROM members WHERE email = $1', [email]);
        if (userExists.rowCount && userExists.rowCount > 0) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Count users to determine if this is the first admin
        const userCount = await query('SELECT COUNT(*) FROM members');
        const isFirstUser = parseInt(userCount.rows[0].count) === 0;

        const id = crypto.randomUUID();
        const avatarInitials = name.substring(0, 2).toUpperCase();

        // Permissions logic
        const permissions = isFirstUser
            ? ['DASHBOARD', 'STUDIO', 'AGENCY', 'SQUADS', 'TALENTS', 'CONTRIBUTIONS', 'SETTINGS', 'PROFILE']
            : ['PROFILE'];

        const accessRoleId = isFirstUser ? 'admin' : 'viewer';
        const userRole = role || 'Member';

        // Insert into database
        const newUserQuery = `
            INSERT INTO members (
                id, name, email, password_hash, role, academic_role, bio, 
                avatar_initials, is_admin, access_role_id, permissions
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *
        `;

        const result = await query(newUserQuery, [
            id, name, email, hashedPassword, userRole, academicRole, bio,
            avatarInitials, isFirstUser, accessRoleId, JSON.stringify(permissions)
        ]);

        const newUser = mapUserFromDB(result.rows[0]);

        if (!newUser) {
            throw new Error("Failed to create user object");
        }

        // Generate JWT with role claim for middleware RBAC
        const token = await new SignJWT({
            id: newUser.id,
            email: newUser.email,
            role: userRole // CRITICAL for middleware-level RBAC
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        });

        return NextResponse.json({
            user: newUser
        });
    } catch (error) {
        console.error('[AUTH] Registration error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

