/**
 * @file lib/supabase/serviceRoleClient.ts
 * @description 서버 전용 Supabase service role 클라이언트 (RLS 우회)
 *
 * [보안 가이드 — 필독]
 * 1. SUPABASE_SERVICE_ROLE_KEY는 절대 NEXT_PUBLIC_ 접두사를 붙이지 마세요.
 * 2. 이 파일은 src/app/api/admin/** Route Handler에서만 import 하세요.
 * 3. 클라이언트 컴포넌트·브라우저 번들·middleware에서 import 금지.
 * 4. service role은 RLS를 우회합니다. verifyAdminRequest로 admin 검증 후에만 호출하세요.
 * 5. Git 커밋·로그·에러 응답에 키 값을 포함하지 마세요.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getServiceRoleEnv } from "@/lib/supabase/env";

let serviceRoleClient: SupabaseClient | null = null;

/**
 * auth.admin.deleteUser 등 RLS 우회가 필요한 관리자 API 전용 클라이언트
 */
export function getServiceRoleClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "service role 클라이언트는 서버(Route Handler)에서만 사용할 수 있습니다.",
    );
  }

  if (serviceRoleClient) return serviceRoleClient;

  const { url, serviceRoleKey } = getServiceRoleEnv();
  serviceRoleClient = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return serviceRoleClient;
}
