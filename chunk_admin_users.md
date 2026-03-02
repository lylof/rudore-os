
---

## 🛑 FICHIER : `app/api/admin/users/route.ts`

### [ARCHITECTURE & PERFORMANCES] - Lignes 21-24 :
**Le problème :** L'exécution de `await jwtVerify(token, secretUint8);` dans la route API.
**Le risque :** C'est une abomination architecturale si tu as déjà un `middleware.ts` qui vérifie le JWT sur `/api/*`. Tu forces ton serveur à décrypter cryptographiquement le même jeton *deux fois* pour une seule requête HTTP. C'est un gaspillage massif de CPU.
**La Solution Experte :** Le middleware authentifie, la route API autorise. Le middleware DOIT injecter l'identité de l'utilisateur dans les headers (ex: `x-user-id`, `x-user-role`), et la route API doit simplement consommer ces headers (O(1) access time).

### [SÉCURITÉ CRITIQUE : DÉNI DE SERVICE (DoS)] - Ligne 34 :
**Le problème :** La requête `await db.query('SELECT * FROM members ORDER BY name ASC');`.
**Le risque :** AUCUNE PAGINATION. C'est une bombe à retardement de type "Resource Exhaustion" (OWASP). Si ton application a du succès et que la table `members` atteint 50 000 lignes, cet appel va tenter d'allouer des centaines de mégaoctets de RAM pour transformer le résultat en JSON. Vercel ou ton serveur Node.js va crasher avec une erreur `OOM (Out Of Memory)` et toutes les autres requêtes des autres utilisateurs échoueront.
**La Solution Experte :** Imposer systématiquement un système de Pagination (Limit / Offset) ou de Curseur (Keyset Pagination) sur toute requête renvoyant des collections.

**La Solution Experte (Code Refactorisé Complet) :**
```typescript
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import db from '../../../../lib/db';
import { mapUserFromDB } from '../../../../lib/utils/db-mapper';

export async function GET(request: NextRequest) {
    // 1. Consommation du contexte injecté par le Middleware (Zéro décryptage JWT ici)
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // 2. Vérification RBAC (Role-Based Access Control) O(1) via le JWT Claim
    // Note: Si le rôle n'est pas fiable dans le JWT, alors on fait la requête DB,
    // mais idéalement le JWT suffit ("ADMIN" ou "SUPER_ADMIN")
    if (userRole !== 'ADMIN' && userRole !== 'SUPER_ADMIN') {
        // Fallback sécuritaire au cas où le rôle n'est pas dans le JWT
        const adminCheck = await db.query('SELECT is_admin, role FROM members WHERE id = $1', [userId]);
        const currentUser = adminCheck.rows[0];

        if (!currentUser || (!currentUser.is_admin && currentUser.role !== 'ADMIN')) {
            console.warn(`[SECURITY] User ${userId} attempted to access admin route.`);
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }
    }

    try {
        // 3. Pagination obligatoire (Défense contre DoS et OOM)
        const { searchParams } = new URL(request.url);
        
        // Defaults: page 1, limit 50 (Maximum dur: 100)
        let page = parseInt(searchParams.get('page') || '1', 10);
        let limit = parseInt(searchParams.get('limit') || '50', 10);
        
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1 || limit > 100) limit = 50;
        
        const offset = (page - 1) * limit;

        const usersResult = await db.query(
            'SELECT * FROM members ORDER BY name ASC LIMIT $1 OFFSET $2',
            [limit, offset]
        );

        const safeUsers = usersResult.rows.map(u => mapUserFromDB(u));

        // Retourne également les métadonnées de pagination pour le frontend
        return NextResponse.json({
            data: safeUsers,
            meta: {
                page,
                limit,
                count: safeUsers.length // Idéalement fournir le total count avec une autre query
            }
        });
    } catch (error) {
        console.error('[ADMIN API CRITICAL] Users fetch error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
```
