
---

## 🛑 FICHIER : `app/api/auth/login/route.ts`

### [SÉCURITÉ CRITIQUE : OWASP] - Lignes 23 :
**Le problème :** L'évaluation `if (!user || !(await bcrypt.compare(password, user.password_hash)))`.
**Le risque :** C'est une vulnérabilité classique d'**Énumération d'Utilisateurs par Timing Attack**. Si l'email n'existe pas, `!user` est vrai et l'évaluation court-circuite (le `bcrypt.compare` n'est jamais exécuté). Le serveur répond en ~10ms. Si l'email existe, le serveur doit calculer le hash bcrypt, et répond en ~100-300ms. N'importe quel attaquant peut scripter une attaque temporelle pour découvrir tous les emails valides de ta base de données clients.
**La Solution Experte :** Il faut TOUJOURS exécuter un calcul de hachage bidon (dummy hash) pour lisser les temps de réponse, afin qu'une tentative avec un email invalide prenne exactement le même temps qu'un email valide.

### [SÉCURITÉ D'ARCHITECTURE] - Ligne 28 :
**Le problème :** Création du JWT : `new SignJWT({ id: user.id, email: user.email })`.
**Le risque :** Dans le `middleware.ts`, tu as essayé d'extraire `payload.role`... mais tu as **oublié** de l'inclure ici au moment de la création du jeton ! Pire, cela signifie que `String(payload.role)` dans le middleware va écrire la chaîne de caractères `"undefined"` dans le header `x-user-role`, cassant potentiellement toutes les sécurités des routes d'administration. Il faut ABSOLUMENT standardiser les "Claims" du JWT (Typage fort).

### [SÉCURITÉ DES DONNÉES / PRIVACY] - Ligne 35 :
**Le problème :** Retour de l'objet utilisateur : `{ ...user, password_hash: undefined }`.
**Le risque :** C'est une stratégie de "Blacklist". Si demain un autre dev ajoute une colonne `two_factor_secret` ou `stripe_customer_id` dans la table `members`, ces données fuiteront instantanément vers le client frontend (qui pourrait les mettre dans le LocalStorage).
**La Solution Experte :** Toujours faire du "Whitelist" explicite (Data Transfer Object / DTO).

**La Solution Experte (Code Refactorisé Complet) :**
```typescript
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import db from '../../../../lib/db';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL [login]: JWT_SECRET environment variable is missing or too weak (min 32 chars).');
}
const secretUint8 = new TextEncoder().encode(JWT_SECRET);

// Hash bidon pré-calculé pour contrecarrer les Timing Attacks (correspond à un mot de passe classique)
// Ce hash doit idéalement avoir le même "cost factor" que tes mots de passe réels.
const DUMMY_HASH = '$2a$10$wE/.7.x/rX1K08h7O3T9.OaU.C8PXZFpZQyLcG5OqZQgqZQgqZQgq';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
            return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
        }

        const result = await db.query('SELECT id, email, role, password_hash FROM members WHERE email = $1', [email.toLowerCase()]);
        const user = result.rows[0];

        // DEFENSE CONTRE TIMING ATTACK : 
        // Si user == null, on compare le mot de passe avec le dummy_hash
        const hashToCompare = user ? user.password_hash : DUMMY_HASH;
        const isPasswordValid = await bcrypt.compare(password, hashToCompare);

        // Si user n'existait pas OU password invalide, on rejette avec un message OPAQUE
        if (!user || !isPasswordValid) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        // JWT Claims stricts et complets
        const payload = { 
            id: user.id, 
            email: user.email,
            role: user.role // CRITIQUE pour le middleware
        };

        const token = await new SignJWT(payload)
            .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
            .setIssuedAt()
            .setExpirationTime('24h')
            .sign(secretUint8);

        // Whitelist explicite (DTO)
        const safeUser = {
            id: user.id,
            email: user.email,
            role: user.role
        };

        const cookieStore = await cookies();
        cookieStore.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 // 24h
        });

        return NextResponse.json({ token, user: safeUser });

    } catch (error) {
        console.error('[LOGIN CRITICAL] Failed login attempt:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
```
