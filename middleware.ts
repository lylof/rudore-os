import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
    throw new Error('FATAL [middleware]: JWT_SECRET environment variable is missing or too weak (min 32 chars).');
}

const secret = new TextEncoder().encode(JWT_SECRET);

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
        return NextResponse.json({ message: 'Unauthorized: No credentials provided' }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, secret);

        // Propagation du Contexte (Architecture Critique)
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
        return NextResponse.json({ message: 'Unauthorized: Invalid or expired token' }, { status: 401 });
    }
}

export const config = {
    matcher: ['/api/:path*'],
};
