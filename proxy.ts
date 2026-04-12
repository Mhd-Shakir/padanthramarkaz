import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

const protectedRoutes = ['/dashboard', '/superadmin'];
const authRoutes = ['/auth'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/auth', request.url));
      response.cookies.delete('auth_token');
      return response;
    }

    // Super admin trying to access /dashboard
    if (pathname.startsWith('/dashboard') && payload.isSuperAdmin) {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }

    // Regular admin trying to access /superadmin
    if (pathname.startsWith('/superadmin') && !payload.isSuperAdmin) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  if (isAuthRoute && token) {
    const payload = await verifyToken(token);
    if (payload) {
      return NextResponse.redirect(
        new URL(payload.isSuperAdmin ? '/superadmin' : '/dashboard', request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*', '/auth'],
};
