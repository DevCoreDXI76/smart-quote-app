/**
 * @file middleware.ts
 * @description /admin 경로 edge 보안 — admin role만 접근 허용
 *
 * [보안 가이드]
 * - UI의 isAdmin 가드만으로는 URL 직접 접근을 막을 수 없습니다.
 * - middleware에서 JWT + public.users.role을 검증한 뒤 non-admin은 / 로 redirect.
 * - API Route(/api/admin/*)는 별도 verifyAdminRequest로 이중 검증합니다.
 */

import { NextResponse, type NextRequest } from "next/server";

import { createMiddlewareSupabaseClient } from "@/lib/supabase/middlewareClient";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  try {
    const supabase = createMiddlewareSupabaseClient(request, response);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const { data: profile, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error || profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
