import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { hasSupabaseConfig } from '@/lib/env';

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/auth/callback', '/setup'];
const ADMIN_ROUTES = ['/', '/employees', '/custody', '/invoices', '/missing-invoices', '/card-expenses', '/subscriptions', '/investments', '/wealth', '/reconciliation', '/reports', '/notifications', '/assistant', '/settings', '/documents', '/approvals'];
const PORTAL_ROUTES = ['/portal'];
const ADMIN_ROLES = ['super_admin', 'finance_manager', 'accountant', 'auditor'];

export async function updateSession(request: NextRequest) {
  if (!hasSupabaseConfig()) {
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/setup';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
  const isPortal = PORTAL_ROUTES.some((r) => pathname.startsWith(r));
  const isApi = pathname.startsWith('/api');

  if (isApi) return supabaseResponse;

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === '/login' || pathname === '/register')) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  if (user && (isPortal || ADMIN_ROUTES.some((r) => r === pathname || (r !== '/' && pathname.startsWith(r))))) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'employee';

    if (isPortal && ADMIN_ROLES.includes(role) && !pathname.includes('/portal/admin')) {
      // Admins can access portal too
    } else if (isPortal && role === 'employee') {
      // Employee portal access OK
    } else if (isPortal && !ADMIN_ROLES.includes(role) && role !== 'employee') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    } else if (!isPortal && !isPublic && role === 'employee') {
      const url = request.nextUrl.clone();
      url.pathname = '/portal';
      return NextResponse.redirect(url);
    } else if (!isPortal && !isPublic && role === 'auditor') {
      const writeRoutes = ['/settings', '/custody', '/approvals'];
      if (writeRoutes.some((r) => pathname.startsWith(r))) {
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
      }
    }
  }

  return supabaseResponse;
}
