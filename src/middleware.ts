import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'sigh_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas protegidas que requieren autenticación
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/reportes') ||
    pathname.startsWith('/productividad');

  const cookie = request.cookies.get(COOKIE_NAME);

  if (isProtectedRoute) {
    if (!cookie) {
      // Redirigir a login si no existe la cookie
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const token = cookie.value;
      const parts = token.split('.');
      if (parts.length === 3) {
        // Decodificar Base64URL de forma segura en entorno Edge con atob
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const payload = JSON.parse(jsonPayload);
        
        // Verificar fecha de expiración
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          console.warn('[Middleware] Sesión de usuario expirada.');
          const loginUrl = new URL('/login', request.url);
          const response = NextResponse.redirect(loginUrl);
          response.cookies.delete(COOKIE_NAME);
          return response;
        }
      } else {
        throw new Error('Formato JWT inválido');
      }
    } catch (e) {
      console.error('[Middleware] Error al verificar sesión:', e);
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }
  }

  // Redirigir a dashboard si el usuario ya está autenticado e intenta entrar a login o raíz
  if (pathname === '/login' || pathname === '/') {
    if (cookie) {
      try {
        const token = cookie.value;
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const payload = JSON.parse(atob(base64));
          if (payload.exp && Date.now() < payload.exp * 1000) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
          }
        }
      } catch (_) {}
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/reportes/:path*',
    '/productividad/:path*',
    '/login',
    '/',
  ],
};
