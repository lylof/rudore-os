# Rudore OS Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Standardize Rudore OS to be "Design System Native", secure backend logic, and fix accessibility issues.

**Architecture:** 
1. **Security Layer**: Centralize JWT config, enforce environment variables, and implement robust middleware validation.
2. **Logic Layer**: Fix permission persistence and use secure UUIDs for entities.
3. **Design System**: Refactor components to use CSS variables and DS tokens instead of hardcoded values.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, PostgreSQL, Jose (for Edge JWT).

---

### [x] Task 1: Core Security & Dependencies

**Files:**
- Modify: `package.json`
- Modify: `middleware.ts`
- Modify: `lib/auth.ts`
- Modify: `app/api/auth/login/route.ts`
- Modify: `app/api/auth/register/route.ts`
- Modify: `app/api/admin/users/route.ts`
- Modify: `app/api/admin/roles/route.ts`

**Step 1: Install `jose` for Edge-compatible JWT**
Run: `npm install jose`

**Step 2: Update `lib/auth.ts` to enforce JWT_SECRET**
```typescript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
}
```

**Step 3: Implement robust `middleware.ts`**
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('token')?.value;
    const isApiRoute = request.nextUrl.pathname.startsWith('/api');
    const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth');

    if (isApiRoute && !isAuthRoute) {
        if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        try {
            await jwtVerify(token, JWT_SECRET);
        } catch (e) {
            return NextResponse.json({ message: 'Invalid or expired token' }, { status: 401 });
        }
    }
    return NextResponse.next();
}
```

**Step 4: Cleanup fallback secrets in all API routes**
Remove `|| 'rudore-secret-key-change-me'` from all routes.

**Step 5: Commit security changes**
`git commit -m "security: enforce JWT_SECRET and add robust middleware validation"`

---

### [x] Task 2: Backend Logic Fixes

**Files:**
- Modify: `app/api/auth/register/route.ts`
- Modify: `scripts/seed-db.js`

**Step 1: Persist permissions in Register**
Ensure `permissions` array is inserted into the `members` table (requires checking table schema first, or adding column).

**Step 2: Use `crypto.randomUUID()` for IDs**
```typescript
const id = crypto.randomUUID();
```

**Step 3: Fix `seed-db.js` variable bug**
Replace `client.query` calls with the correct client/pool instance if not defined.

**Step 4: Commit logic fixes**
`git commit -m "fix: persist permissions and use secure UUIDs"`

---

### [x] Task 3: Design System Harmonization (Typography)

**Files:**
- Modify: `components/BentoGrid.tsx`
- Modify: `components/Sidebar.tsx`
- Modify: `components/SquadMatrix.tsx`

**Step 1: Replace `text-[10px]` and `text-sm` with DS classes**
- `text-sm` (14px) -> `text-body-text` (or specific if defined)
- `text-[10px]` -> `text-caption-label` (11px as per DS.json) or adjust DS.json if 10px is strictly needed.

**Step 2: Standardize fonts**
Ensure headers use `font-header` and body uses `font-sans` explicitly if not inherited.

**Step 3: Commit typo harmonization**
`git commit -m "style: harmonize typography with design system tokens"`

---

### [x] Task 4: Design System Harmonization (Colors & Cleanup)

**Files:**
- Modify: `components/BentoGrid.tsx`
- Modify: `components/ProjectHub.tsx`
- Modify: `app/globals.css`

**Step 1: Replace `bg-zinc-900` / `text-zinc-400` with semantic variables**
Use `bg-rudore-panel`, `text-rudore-text-secondary`, etc.

**Step 2: Clean up `globals.css` Light Mode Overrides**
Once components use semantic variables, remove the re-mapping of zinc classes in `globals.css`.

**Step 3: Commit color standardization**
`git commit -m "style: replace hardcoded colors with semantic design tokens"`

---

### [x] Task 5: UI/UX & Accessibility

**Files:**
- Modify: `components/Sidebar.tsx`
- Modify: `components/ThemeToggle.tsx` (if exists)

**Step 1: Fix Sidebar truncation**
Replace `w-24 truncate` with a more flexible layout (e.g., `flex-1 min-w-0` and `truncate`).

**Step 2: Add ARIA labels**
Add `aria-label` to all icon-only buttons (`LogOut`, `ThemeToggle`).

**Step 3: Final Commit**
`git commit -m "ui: fix accessibility and layout issues"`

---

## Verification Plan

### Automated Tests
1. **Security**: Try to access `/api/admin/users` with a fake cookie.
   - Command: `curl -b "token=invalid" http://localhost:3000/api/admin/users`
   - Expected: `401 Unauthorized` or `Invalid token`.
2. **Registration**: Register a new user and check DB for permissions.
   - Command: Manual check in DB via `psql`.

### [x] Task 6: Final Verification & Documentation
1. **Design System**: Toggle Light/Dark mode and verify that no "dark patches" remain (due to hardcoded zinc classes).
2. **Layout**: Test Sidebar with a very long user name (e.g., "Alexander Maximilian von Rudore").
3. **Accessibility**: Use Tab navigation to ensure all interactive elements focus correctly.
