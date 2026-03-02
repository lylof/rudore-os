
---

## 🛑 FICHIER : `lib/auth.ts`

### [SÉCURITÉ CRITIQUE] - Lignes 7-17 :
**Le problème :** Tu fais la même erreur critique d'architecture de configuration que pour le middleware : un fallback de développement hardcodé (`const FINAL_SECRET = JWT_SECRET || 'rudore-dev-secret-unsafe';`). Pire encore, la logique conditionnelle sur `production` lance une erreur dans un bloc `if`, mais continue l'exécution avec le fallback "unsafe" si l'erreur n'est pas interceptée ou en dehors de production.
**Le risque :** Une persistance des Credentials par défaut. N'importe qui clonant ton repo a accès au secret de dev. S'il devine qu'une instance staging/pre-prod tourne sans cette variable, la base entière est prenable par forgeage de fausses identités JWT. L'application ne doit JAMAIS booter, même en local, sans clé cryptographique forte et explicite.

### [PERFORMANCES & ARCHITECTURE] - Lignes 28-30 :
**Le problème :** L'appel en base de données systématique (`await query('SELECT * FROM members WHERE id = $1', [payload.id]);`) **à l'intérieur** d'une fonction d'authentification appelée `verifyAuth`.
**Le risque :** C'est un anti-pattern majeur dans les écosystèmes Next.js Server Components. Si tu appelles `verifyAuth()` dans ta Sidebar, ta Navbar, et le Page component principal, tu vas exécuter **3 requêtes SQL identiques par page vue** (N+1 queries version auth). Par ailleurs, utiliser une DB pour valider un JWT détruit l'intérêt même du JWT (qui est un jeton censé être validé de manière *stateless*).
**La Solution Experte :** Utiliser `React.cache()` pour mémoizer l'appel DB durant le cycle de vie d'une seule et même requête serveur HTTP. Cela garantit 1 seule query DB maximum, peu importe le nombre d'appels à `verifyAuth()`.

### [ROBUSTESSE & EDGE CASES] - Lignes 18 & 33-35 :
**Le problème :** 
1. `export async function verifyAuth(req?: NextRequest)`: Le paramètre `req` est pris en argument, mais tu utilises `cookies()` de `next/headers` à l'intérieur. Le paramètre `req` est confondu avec le contexte, ce qui induit l'erreur de se croire dans un environnement `API Route` alors que `cookies()` est fait pour le `Server Component`. C'est du code mort (Dead Code) très confusifiant.
2. Le grand `try/catch` avec un `return null;` silencieux global.
**Le risque :** Si ta base de données crashe ou fait un Timeout, l'application retourne silencieusement `null`, de-loguant instantanément tous les utilisateurs sans laisser la moindre trace ou alerte dans tes logs serveur. Un cauchemar absolu à débugger en production ! 

**La Solution Experte (Code Refactorisé Complet) :**
```typescript
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
```
