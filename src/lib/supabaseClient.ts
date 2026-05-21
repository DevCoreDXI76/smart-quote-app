/**
 * @file lib/supabaseClient.ts
 * @description 브라우저용 Supabase 클라이언트 싱글톤
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseEnv } from "@/lib/supabase/env";

let browserClient: SupabaseClient | null = null;

/**
 * 클라이언트 컴포넌트·훅에서 사용할 Supabase 인스턴스를 반환합니다.
 */
export function getSupabaseClient(): SupabaseClient {
  if (browserClient) return browserClient;

  const { url, anonKey } = getSupabaseEnv();
  browserClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}
