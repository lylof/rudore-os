import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { query } from './db';
import { mapUserFromDB } from './utils/db-mapper';
import { cache } from 'react';

// 1. FAIL-FAST SECURITE : Refus de démarrage sans secret fort (peu importe l'env)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL [lib/auth]: JWT_SECRET environment variable is missing or too weak (min 32 chars).');
}

const secretUint8 = new TextEncoder().encode(JWT_SECRET);

// 2. PERFORMANCE MAXIMALE (Mémoization Request-level)
// React.cache garantit l'unicité de l'appel DB durant un cycle HTTP, même si 10 Server Components l'appellent.
export const verifyAuth = cache(async () => {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (!token) return null;

        // Décryptage stateless
        const { payload } = await jwtVerify(token, secretUint8);

        if (!payload || !payload.id) {
            console.error('[AUTH] JWT valid but missing mandatory user ID in payload.');
            return null;
        }

        // 3. Hydratation de l'utilisateur (mémoizée par request)
        const result = await query('SELECT * FROM members WHERE id = $1', [payload.id]);

        if (result.rows.length === 0) {
            console.warn(`[AUTH] Ghost authentication: User ID ${payload.id} found in JWT but missing in database.`);
            return null;
        }

        return mapUserFromDB(result.rows[0]);
    } catch (error) {
        // 4. ROBUSTESSE: Ne jamais étouffer une vraie erreur (DB dead, signature invalidée)
        if (error instanceof Error && error.name === 'JWTExpired') {
            // Expiration normale, pas besoin de polluer les logs
            return null;
        }

        console.error('[AUTH ERROR] verifyAuth failing hard. Investigation needed:', error);
        return null; // Fallback sécuritaire (on refuse l'accès si on ne comprend pas l'erreur)
    }
});
