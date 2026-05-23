/**
 * @file lib/supabase/middlewareClient.ts
 * @description Next.js middleware 전용 Supabase SSR 클라이언트
 *
 * [보안 가이드]
 * - middleware에서 /admin 접근 시 JWT + public.users.role 검증
 * - service role key는 이 모듈에서 사용하지 않습니다.
 */

import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";

import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * middleware용 Supabase 클라이언트 (쿠키 read/write)
 */
export function createMiddlewareSupabaseClient(
  request: NextRequest,
  response: NextResponse,
) {
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      },
    },
  });
}
