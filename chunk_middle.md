
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
