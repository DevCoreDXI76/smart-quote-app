/**
 * @file lib/supabase/serverClient.ts
 * @description Route Handler용 Supabase SSR 클라이언트 (쿠키 세션)
 *
 * [보안 가이드]
 * - /api/admin/* 에서 verifyAdminRequest와 함께 사용
 * - anon key + 사용자 JWT로 RLS·RPC 호출 (service role 불필요한 작업)
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Route Handler에서 현재 요청 사용자 세션으로 Supabase 클라이언트 생성
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Component에서 set 불가 시 무시 (Route Handler에서는 정상 동작)
        }
      },
    },
  });
}
