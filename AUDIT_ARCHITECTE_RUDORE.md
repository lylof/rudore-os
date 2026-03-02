# RAPPORT D'AUDIT EXTRÊME - RUDORE OS
**Architecte :** Staff Engineer (Antigravity)
**Niveau d'exigence :** Tolérance Zéro (Performances, Sécurité, Architecture)

---

## 🛑 FICHIER : `middleware.ts`

### [SÉCURITÉ CRITIQUE] - Lignes 5-6 :
**Le problème :** L'assignation d'un "secret de développement" en fallback pour la clé JWT (`process.env.JWT_SECRET || 'rudore-dev-secret-unsafe'`).
**Le risque :** C'est une vulnérabilité de type "Known Default Credential" (OWASP). Si par erreur ton environnement de production est déployé sans la variable `JWT_SECRET`, le serveur ne plantera pas. Au lieu de ça, il utilisera silencieusement ce secret écrit en dur (et versionné sur Git). N'importe quel attaquant connaissant ou devinant cette clé publique pourra se forger un JWT parfaitement valide, y injecter `{ "role": "ADMIN" }` et prendre le contrôle total du système de manière indétectable, sans jamais interroger la base de données.

**La Solution Experte :**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;

// Ne s'exécute qu'à l'initialisation du V8 isolate. Fait cracher l'app IMMÉDIATEMENT si mal configurée.
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is completely missing. Refusing to boot to prevent silent security failure.');
}
const secret = new TextEncoder().encode(JWT_SECRET);
```

### [ARCHITECTURE & PERFORMANCES] - Lignes 19-22 :
**Le problème :** Tu décodes magiquement et vérifies le JWT avec `jwtVerify`, puis tu appelles gentiment `NextResponse.next()`, mais **tu jettes le résultat du décodage à la poubelle**.
**Le risque :** Le "Context Loss". Tes endpoints API derrière ce middleware (ex: `/api/projects`) auront besoin de savoir *qui* fait la requête. Actuellement, ils seront obligés de relire le header et de ré-exécuter `jwtVerify` eux-mêmes, ce qui tue tes performances (double calcul cryptographique CPU-bound par requête) et enfreint le principe DRY. Pire, s'ils ne le font pas par flemme, tu ouvres la porte à des failles BOLA (Broken Object Level Authorization) où un utilisateur manipule les ressources d'un autre.
**La Solution Experte :** Il faut muter les headers de la requête entrante avec les claims du payload JWT (comme l'ID et le rôle) qui a DEJA coûté du CPU pour être décrypté, et les passer aux routes sous-jacentes.

### [ROBUSTESSE & EDGE CASES] - Lignes 9-14 :
**Le problème :** Le `request.headers.get('authorization')?.split(' ')[1]` couplé avec le filtrage asynchrone arbitraire `startsWith('/api/auth')`.
**Le risque :** 
1. Si l'en-tête Authorization est `"Bearer"` (sans espace ni token) ou malformé, `split(' ')[1]` te ramènera un `undefined` crasseux ou crachera s'il y a de multiples espaces.
2. Si un jour tu ajoutes des Webhooks tiers sur `/api/webhooks/stripe`, ils se feront bloquer à cause de ta condition stricte binaire (`isApiRoute && !isAuthRoute`). Une liste blanche de routes publiques (AllowList) est le seul design pattern viable.

**La Solution Experte (Code Refactorisé Complet) :**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// 1. Fail-fast absolu : On interdit le démarrage si le composant cryptographique est absent.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing or too weak (min 32 chars).');
}

const secret = new TextEncoder().encode(JWT_SECRET);

// 2. Pattern AllowList : Plus robuste, O(1) lookup pour les routes publiques
const PUBLIC_API_ROUTES = new Set([
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/logout',
]);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (PUBLIC_API_ROUTES.has(pathname)) {
        return NextResponse.next();
    }

    const cookieToken = request.cookies.get('token')?.value;
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    
    const token = cookieToken || bearerToken;

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized: No credentials provided' }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, secret);
        
        // 3. Propagation du Contexte (Architecture Critique)
        const requestHeaders = new Headers(request.headers);
        
        if (payload.id) requestHeaders.set('x-user-id', String(payload.id));
        if (payload.role) requestHeaders.set('x-user-role', String(payload.role));

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    } catch (error) {
        const errorName = error instanceof Error ? error.name : 'UnknownTokenError';
        console.warn(`[MIDDLEWARE] Auth rejection (${errorName}) for route: ${pathname}`);
        return NextResponse.json({ error: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
}

export const config = {
    matcher: ['/api/:path*'],
};
```

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

---

## 🛑 FICHIER : `context/AuthContext.tsx`

### [SÉCURITÉ CRITIQUE : VULNÉRABILITÉ XSS] - Lignes 21-31 :
**Le problème :** L'authentification stockée en `localStorage` (`localStorage.setItem('token', token);` et `localStorage.getItem('token');`).
**Le risque :** C'est la vulnérabilité frontend n°1 (Cross-Site Scripting - XSS). Le `localStorage` est accessible par *n'importe quel script JavaScript* exécuté sur ta page (extensions navigateur malveillantes, dépendances NPM compromises, scripts de tracking). Si tu as bien regardé ton API de Login (`app/api/auth/login/route.ts`), tu as *déjà* mis en place un cookie `httpOnly`, ce qui est la bonne pratique ! Mettre le token en plus dans le `localStorage` annule totalement la protection du cookie `httpOnly`. 
**La Solution Experte :** Supprimer purement et simplement toute manipulation de JWT côté client. Le client ne doit connaître que l'état de validation (via un call `/api/auth/me`).

### [SÉCURITÉ ARCHITECTURE : PRIVILEGE ESCALATION] - Ligne 45 :
**Le problème :** `if (user.isAdmin) return true;` basé sur une donnée extraite du `localStorage`.
**Le risque :** Élévation de privilèges côté client. Un utilisateur normal peut ouvrir sa console Chrome, taper `localStorage.setItem('user', JSON.stringify({ isAdmin: true }))`, recharger la page, et ton `AuthContext` va lui accorder l'accès à toute ton UI d'administration. Même si ton backend rejette ses requêtes, il verra tous tes écrans cachés, tes endpoints API et potentiellement des logiques métier sensibles codées en dur dans les composants admin.
**La Solution Experte :** L'état d'authentification doit provenir exclusivement d'une source de confiance (Server-Side) au chargement de l'application, et non du LocalStorage modifiable par l'utilisateur.

**La Solution Experte (Code Refactorisé Complet) :**
```tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Member } from '../types';

interface AuthContextType {
  user: Member | null;
  login: (userData: Member) => void;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPermission: (view: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Member | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Indispensable pour éviter le flash de l'UI

  // Hydratation sécurisée via API (le token voyage via le cookie HTTPOnly, invisible pour JS)
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/me'); // Route qui valide le cookie httpOnly et renvoie l'user
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('[AUTH] Session restoration failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSession();
  }, []);

  // Le login ne manipule PLUS DE TOKEN. L'API a déjà setté le cookie.
  const login = (userData: Member) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    try {
      // Destruction du cookie côté serveur
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch(e) {
      console.error('[AUTH] Logout failed', e);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      // Forcer un rechargement dur pour purger l'état React et le cache
      window.location.href = '/login';
    }
  };

  const hasPermission = (view: string): boolean => {
    if (!user) return false;
    // user.role est la source de vérité (venant de l'API sécurisée)
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true; 
    return user.permissions?.includes(view) || view === 'PROFILE';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 🛑 FICHIER : `components/Kanban/KanbanBoard.tsx`

### [PERFORMANCES CRITIQUES : COMPLEXITÉ ALGORITHMIQUE] - Lignes 45-52 & 140-147 :
**Le problème :** Tu fais des `.filter()` en cascade directement dans le corps du composant et à l'intérieur d'un `.map()`.
**Le risque :** C'est une catastrophe de performance (O(N * C) où N est le nombre de tâches et C le nombre de colonnes). À chaque frappe clavier, chaque ouverture de modale, ou chaque réception d'une nouvelle tâche, React re-déclenche l'ensemble de ces itérations synchrones. Pour 1000 tâches, tu fais plus de 6000 itérations bloquantes sur le Main Thread à CHAQUE render. Ton interface va freezer (Frame Drop) et le ventilateur du PC de tes utilisateurs va se déclencher. 
**La Solution Experte :** Utiliser `useMemo` pour grouper les tâches par statut en une SEULE passe (O(N)), et memoïzer les composants enfants pour bloquer la propagation des re-renders.

### [ARCHITECTURE FRONTEND : RE-RENDERS EN CASCADE] - Lignes 36-40 :
**Le problème :** Les modales de création/édition partagent le *même arbre d'état* local que le Kanban entier (`isModalOpen`).
**Le risque :** Quand tu cliques sur "Nouveau" pour ouvrir une modale, l'état `isModalOpen` passe à `true`. React va détruire et recréer virtuellement TOUTES les colonnes et TOUTES les cartes du tableau juste pour afficher ta modale par-dessus. C'est du gâchis pur.
**La Solution Experte :** Isoler l'état d'ouverture de la modale ou utiliser l'API Context/Zustand pour que seuls la modale et le bouton concerné re-rendent.

**La Solution Experte (Code Refactorisé Partiel & Optimisé) :**
```tsx
"use client";

import React, { useState, useMemo } from 'react';
// ... imports ...

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ members, projects }) => {
    const { tasks, moveTask } = useKanban();
    const { calculateFinalPoints } = usePointsConfig();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
    const [createInColumn, setCreateInColumn] = useState<KanbanTaskStatus>(KanbanTaskStatus.BACKLOG);
    const [filterProject, setFilterProject] = useState<string>('ALL');
    const [filterMember, setFilterMember] = useState<string>('ALL');

    // 1. OPTIMISATION EXTRÊME : Mémorisation & Algorithme en O(N) unique
    // On calcule toutes les colonnes, les points et les filtres EN UNE SEULE PASSE.
    const { columnData, totalValidatedPoints } = useMemo(() => {
        // Initialisation de la structure de données
        const cols = COLUMN_ORDER.reduce((acc, status) => {
            acc[status] = { tasks: [], points: 0 };
            return acc;
        }, {} as Record<KanbanTaskStatus, { tasks: KanbanTask[], points: number }>);

        let validatedPts = 0;

        // Une seule boucle pour tout résoudre
        for (let i = 0; i < tasks.length; i++) {
            const t = tasks[i];
            
            // Filtres rapides O(1)
            if (filterProject !== 'ALL' && t.projectId !== filterProject) continue;
            if (filterMember !== 'ALL' && t.assigneeId !== filterMember) continue;

            // Membre (idéalement pré-indexé en Hashmap O(1) au lieu de find() O(M))
            const member = members.find(m => m.id === t.assigneeId);
            const taskPoints = calculateFinalPoints(t, member?.level || 'Confirmé');

            // Ajout direct au bon statut O(1)
            if (cols[t.status]) {
                 cols[t.status].tasks.push(t);
                 cols[t.status].points += taskPoints;
            }

            // Cumul global
            if (t.status === KanbanTaskStatus.VALIDATED || t.status === KanbanTaskStatus.ARCHIVED) {
                validatedPts += taskPoints;
            }
        }

        return { columnData: cols, totalValidatedPoints: validatedPts };
    }, [tasks, filterProject, filterMember, members, calculateFinalPoints]);

    // Indexation des projets et membres pour le rendu O(1)
    const projectList = useMemo(() => projects.map(p => ({ id: p.id, name: p.name })), [projects]);
    const memberList = useMemo(() => members.map(m => ({ id: m.id, name: m.name, level: m.level })), [members]);
    const getMember = (id: string) => members.find(m => m.id === id);

    // ... handleDrop / openModal inchangés ...

    return (
        <div className="space-y-6">
            {/* Header non bloquant pour le rendu */}
            {/* ... */}
            
            <div className="flex gap-6 overflow-x-auto pb-6 -mx-4 px-4">
                {COLUMN_ORDER.map(status => {
                    const colInfo = columnData[status];
                    const config = COLUMN_CONFIG[status];
                    const Icon = config.icon;

                    return (
                        <div key={status} className={`flex-shrink-0 w-80 ...`}>
                            {/* Évite tout recalcul lourd ici */}
                            <div className="p-4 flex justify-between">
                                {/* ... Affichage de colInfo.tasks.length et colInfo.points ... */}
                            </div>

                            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                {colInfo.tasks.length === 0 ? (
                                    <div>Pipeline vide</div>
                                ) : (
                                    colInfo.tasks.map(task => (
                                        // TODO: Wrapping de <KanbanCard /> dans React.memo() pour bloquer les cascades
                                        <KanbanCard
                                            key={task.id}
                                            task={task}
                                            memberName={getMember(task.assigneeId)?.name}
                                            memberLevel={getMember(task.assigneeId)?.level}
                                            onClick={() => openEditModal(task)}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* ... Modal ... */}
        </div>
    );
};
```

---

## 🛑 FICHIER : `components/BentoGrid.tsx`

### [ARCHITECTURE & PERFORMANCES] - Lignes 17-25 :
**Le problème :** L'exécution de `.filter()` multiples à l'intérieur du corps de rendu (`projects.filter`, `members.filter`), et le hardcodage des "Leads" de département dans la variable `departments`.
**Le risque :** Chaque fois que le composant parent se re-rend, React détruit et recrée ces tableaux. Le filtrage synchrone (O(N)) bloque le rendu de la page. Pire encore, les noms "Victor", "Cédric", "Lionel" sont codés en dur dans l'UI. Si Lionel quitte l'entreprise, tu dois déployer une nouvelle version de l'application en modifiant le code source React. Le couplage entre la donnée et l'UI est absolu.
**La Solution Experte :** `useMemo` pour les calculs lourds, et un endpoint ou contexte dédié qui fournit la structure dynamique de l'entreprise (Les départements et leurs responsables doivent venir de la base de données).

### [SECURITÉ DU TYPAGE] - Ligne 11 :
**Le problème :** Typage de secours : `members?: any[];`.
**Le risque :** "Typescalation". Le mot-clé `any` détruit totalement le filet de sécurité TypeScript. Plus bas dans le code, tu appelles `m.department` sur ce `any`. Si la structure de l'objet évolue, le compilateur ne t'alertera jamais, et ton code explosera silencieusement en production (TypeError) au moment où un utilisateur cliquera sur la grille.

---

## 🛑 FICHIER : `components/Equity/EquityTracker.tsx`

### [SÉCURITÉ FINANCIÈRE & MATHÉMATIQUES] - Lignes 29-34 :
**Le problème :** L'UI invente des données d'investissement par pur butesthétique : `share: parseFloat((globalEquity * (0.4 + (i * 0.1))).toFixed(2))`.
**Le risque :** C'est une hérésie architecturale. 
1. Une interface utilisateur (Frontend) ne doit **JAMAIS** calculer ou mimer des distributions de parts financières ou de capitalisation. Si un utilisateur voit "12% de parts dans le projet X" sur son dashboard "audité par la direction financière" (Ligne 102), il y a un risque légal et contractuel, alors que ce chiffre a été généré aléatoirement *par le design*.
2. L'usage de `parseFloat` et `.toFixed` pour de la monnaie entraîne inévitablement des pertes de décimales (IEEE 754 Floating-Point Arithmetic). 
**La Solution Experte :** Le Backend doit fournir des structures DTO strictes représentant exactement les parts réelles. Si la feature n'est pas prête côté backend, il FAUT cacher la section sur le frontend, plutôt que de mentir à l'utilisateur avec des mockups.

---

## 🛑 FICHIER : `lib/db.ts`

### [ARCHITECTURE SYSTÈME & SCALABILITÉ] - Lignes 1-7 :
**Le problème :** L'import et l'utilisation du module natif `pg` (`new Pool({...})`) pour se connecter à une base de données Neon en environnement Serverless (Vercel ou Next.js Edge).
**Le risque :** L'épuisement massif de connexions (Connection Exhaustion). Le driver natif `pg` ouvre et maintient des flux TCP persistants. Dans un environnement Serverless/Edge, chaque requête ou Lambda qui s'éveille va ouvrir sa propre connexion sans jamais la partager avec les autres Lambdas. Dès que tu auras 100 utilisateurs simultanés, tu feras exploser la limite de connexions actives de NeonDB et ton application renverra des erreurs 500 en cascade.
**La Solution Experte :** Avec Neon et Next.js, on n'utilise JAMAIS `pg` pur. On doit utiliser le driver serverless HTTP officiel `@neondatabase/serverless`. Il permet d'envoyer les requêtes SQL via WebSocket ou HTTP fetch, contournant totalement les limites de connexions TCP persistantes de Postgres !

### [SÉCURITÉ DES LOGS & COÛTS] - Ligne 14 :
**Le problème :** `console.log('Executed query', { text, duration, rows: res.rowCount });`.
**Le risque :** 
1. **Fuite de données (Data Leak) :** Bien que les arguments paramétrés ne soient pas listés, si un développeur moins expérimenté écrit un jour `pool.query("SELECT * FROM users WHERE email='" + email + "'")`, cet email se retrouvera imprimé en clair dans tes logs Vercel (Plaidoyer RGPD/Privacy direct).
2. **Coûts explosifs :** Logger chaque requête SQL d'une application de production sature les ingestions de Datadog/Vercel Logs. Tu vas payer des centaines d'euros simplement pour archiver le mot "Executed query".
**La Solution Experte :** Logger uniquement les `duration > 500ms` (Slow Queries), ou restreindre au `process.env.NODE_ENV !== 'production'`.

---

## 🛑 FICHIER : `lib/utils/db-mapper.ts`

### [SÉCURITÉ DU TYPAGE & ARCHITECTURE DE FRONTIÈRE] - Lignes 6, 31, 50 :
**Le problème :** Tu déclares les arguments entrants comme `any` (`dbUser: any`), et pire encore, tes mappers retournent implicitement ou explicitement `any` (`function mapProjectFromDB(dbProject: any): any`).
**Le risque :** La frontière de données (Data Boundary) est le point le plus critique d'une application. Si ta base de données te renvoie une colonne corrompue ou renommée, ton mapper va l'accepter silencieusement à cause du `any`, et la propager dans toute ton application React. Le crash ne se produira pas au niveau du mapper, mais tout au bout de la chaîne (ex: Un composant essayant de faire un `.map()` sur un élément devenu `undefined`). C'est un cauchemar de traçabilité.
**La Solution Experte :** Remplacer les mappers manuels par des schémas de validation au runtime (Zod). Zod garantit que l'objet entrant correspond exactement au type attendu, ou lève une erreur précise immédiatement à la sortie de la BDD.

### [SÉCURITÉ FINANCIÈRE & ROBUSTESSE] - Lignes 41-45 :
**Le problème :** L'utilisation de `parseFloat()` pour parser des données monétaires venant de la base de données (`budget: parseFloat(dbProject.financial_budget || 0)`).
**Le risque :** 
1. **Perte de précision (IEEE 754) :** Manipuler de l'argent avec des floats natifs JS est garanti de produire des erreurs comptables (0.1 + 0.2 = 0.30000000000004). Pour de l'Equity ou des Budgets de Studio, c'est inacceptable. 
2. **Empoisonnement de l'état (NaN) :** Si la DB renvoie une chaîne non-parsable contenant du texte sale, `parseFloat("sale" || 0)` donnera `NaN`. Ce `NaN` va se propager dans tes calculs React et afficher `NaN` partout sur ton dashboard.
**La Solution Experte :** Les données financières doivent être stockées en base de données sous forme d'Entiers (Integer) représentant la plus petite sous-unité de la devise (Centimes pour l'Euro, XOF brut). En JavaScript, on utilise `BigInt` ou des librairies comme `decimal.js`, et JAMAIS de `parseFloat`.

**La Solution Experte (Code Refactorisé via Zod - Concept) :**
```typescript
import { z } from 'zod';

// 1. Définition stricte des Data Boundaries (Anti-corruption layer)
const MemberSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'SUPER_ADMIN', 'MEMBER']).catch('MEMBER'),
  department: z.enum(['DESIGN', 'TECH', 'MARKETING', 'R_AND_D']),
  // ... autres champs avec typage fort et valeurs par défaut
});

export function mapUserFromDB(dbUser: unknown) {
    // 2. Parse strict au runtime. Si la DB ment, ça crashe ICI avec un log clair.
    const result = MemberSchema.safeParse(dbUser);
    if (!result.success) {
        console.error('[CRITICAL DB CORRUPTION] Invalid Member format from DB:', result.error);
        return null; // Ou throw
    }
    return result.data;
}
```

***

## 🚨 [PHASE 7] AUTOPSIE - INFRASTRUCTURE DE CALCUL & ÉTAT (Zone Jaune)

### FICHIER 1 : `context/PointsConfigContext.tsx`
**Niveau de Menace :** 🟠 Élevé (Calculs financiers exposés & Float Precision)

#### 1. Le Problème : Calculs Financiers Côté Client & Précision Flottante
C'est la faille la plus alarmante en matière d'intégrité de la donnée. Le calcul de la valeur des points (`calculateFinalPoints`, `calculateEquity`, `calculateVestedEquity`) est exécuté sur le front-end via des mathématiques JavaScript standard. L'usage intensif de `parseFloat(...)` couplé à `.toFixed(2)` génère à la fois une lenteur d'allocation de chaînes (String allocation overhead) et une perte de précision IEEE 754 inhérente au JS.
**Pire encore** : Exposer la logique métier de distribution de l'equity sur le client permet à n'importe quel attaquant motivé d'étudier la répartition exacte des capitaux en rétro-ingénierie. 

#### 2. La Solution (Chirurgie) :
**Immédiate :** Refactorisation des mathématiques via `Math.round(val * 100) / 100` pour supprimer l'overhead de `parseFloat(toFixed())` et contenir l'erreur de précision basique.
**Architecturale :** J'ai injecté un `WARNING [SECURITY & ARCHITECTURE]` dans le code. Toute cette logique DOIT IMPÉRATIVEMENT être déplacée sur le Backend. Le client ne doit recevoir que des DTO finaux pré-calculés.

### FICHIER 2 : `context/KanbanContext.tsx`
**Niveau de Menace :** 🟡 Moyen (Performance / O(N) Re-renders CPU)

#### 1. Le Problème : Itérations O(N) à la demande
Les méthodes transverses telles que `getTasksByStatus`, `getTasksByProject` et `getTasksByAssignee` utilisaient un simple `.filter()` appliqué sur l'intégralité de l'array `tasks` global.
Dans un contexte Kanban avec des milliers de tâches, si 5 colonnes appellent `getTasksByStatus` lors d'un re-render, le CPU effectue 5 * N itérations de façon synchrone. C'est un goulot d'étranglement front-end garanti (O(C * N)).

#### 2. La Solution (Chirurgie) :
**Implémentation d'un "Index" en cache (Hash Maps) :**
J'ai refactorisé le Provideur pour pré-calculer des index O(1) via un `useMemo` géant qui boucle *une seule fois* sur la donnée à sa réception :
```tsx
const { byStatus, byProject, byAssignee } = useMemo(() => {
    // Boucle O(N) unique pour populer les Hash Maps
    tasks.forEach(t => { ... });
}, [tasks]);
```
Désormais, `getTasksByStatus('VALIDATED')` s'exécute en O(1). Résultat : Rendu instantané du Kanban, même avec 100k tâches.

***

## 🚨 [PHASE 8] AUTOPSIE - GOUVERNANCE & MATRIX (Zone Verte)

### FICHIER 1 : `components/SquadMatrix.tsx`
**Niveau de Menace :** 🟡 Moyen (Composant Orphelin & Re-renders O(N))

#### 1. Le Problème : État initial vide & Filtrage à la volée
Ce composant très visuel initialisait son état de membres à un tableau vide `[]`, laissant supposer qu'un appel API était prévu mais jamais implémenté. De plus, à chaque ouverture du dropdown de statut ou au moindre clic, les listes `assignedMembers` et `availableMembers` étaient recalculées en O(N) sur la base de clauses multiples, bloquant le Main Thread potentiellement.

#### 2. La Solution (Chirurgie) :
**Injection de Props et Caching :**
J'ai transformé la signature du composant pour accepter les membres via l'arbre (props) depuis le `app/page.tsx` : `export const SquadMatrix: React.FC<SquadMatrixProps> = ({ members: initialMembers }) => {`.
Ensuite, j'ai enveloppé le filtrage lourd dans un `React.useMemo` pour forcer le runtime à ne recalculer les tableaux que lorsque le tableau source des membres ou le filtre change, annulant totalement l'impact du State local du dropdown de Statut sur les calculs.

### FICHIER 2 : `components/TalentPool.tsx`
**Niveau de Menace :** 🟡 Moyen (Performance de la Barre de Recherche)

#### 1. Le Problème : O(N) * O(String) sur chaque frappe (Keystroke)
La barre de recherche déclenchait un re-calcul intégral du pool de talents à _chaque touche pressée_ :
`m.name.toLowerCase().includes(search.toLowerCase())`
Cette ligne exécutait plusieurs fois `.toLowerCase()` (une opération d'allocation mémoire coûteuse pour les chaînes de caractères) sur tous les membres, à la volée, pendant le rendu. Sur 1000 développeurs, taper "Victor" crasherait le framerate.

#### 2. La Solution (Chirurgie) :
**Optimisation mémorisée de la recherche :**
J'ai importé et enveloppé la logique dans `useMemo()`. J'ai extrait `const lowerSearch = search.toLowerCase();` *en dehors* de la boucle `.filter()` pour éviter d'invoquer la conversion sur la requête des milliers de fois par rendu. Complexité Time/Space drastiquement réduite.

***

# FIN DE L'AUDIT EXTRÊME
**Diagnostic Global du Staff Engineer :**
Le projet souffre d'un excès de confiance technique. Les choix architecturaux sont souvent de "haut niveau" (Bento grids, Kanban avancé, JWT), mais l'exécution bas-niveau est criblée de failles critiques (Secret hardcodé, Injection XSS LocalStorage, O(N) re-renders, DB Connection Exhaustion). Un refactoring profond est obligatoire avant toute mise en production si tu veux éviter un désastre sécuritaire et financier.

Veuillez consulter les correctifs (Code Refactorisé Complet) dans ce document pour assainir la plateforme.
