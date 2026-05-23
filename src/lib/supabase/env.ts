/**
 * @file lib/supabase/env.ts
 * @description Supabase 클라이언트용 환경 변수 읽기·검증
 *
 * [보안 가이드]
 * - NEXT_PUBLIC_* : 브라우저 anon key만 (RLS 적용)
 * - SUPABASE_SERVICE_ROLE_KEY : 서버 전용. 절대 NEXT_PUBLIC_ 접두사 금지.
 *   Route Handler(src/app/api/admin/*)에서만 getServiceRoleEnv() 호출.
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
}

export interface SupabaseServiceRoleEnv extends SupabaseEnv {
  serviceRoleKey: string;
}

/**
 * NEXT_PUBLIC Supabase URL·anon key를 반환합니다.
 * @throws Error 값이 없으면 한글 안내와 함께 throw
 */
export function getSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다. .env.local 파일을 확인해 주세요.",
    );
  }

  return { url, anonKey };
}

/**
 * 서버 전용 service role key (RLS 우회 — 관리자 강제 탈퇴 등)
 * @throws Error 브라우저에서 호출 시 또는 키 미설정 시
 */
export function getServiceRoleEnv(): SupabaseServiceRoleEnv {
  if (typeof window !== "undefined") {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY는 서버 환경(Route Handler)에서만 사용할 수 있습니다.",
    );
  }

  const base = getSupabaseEnv();
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local에 서버 전용 키를 추가해 주세요.",
    );
  }

  return { ...base, serviceRoleKey };
}

/**
 * service role key 설정 여부 (API 503 안내용)
 */
export function isServiceRoleConfigured(): boolean {
  if (typeof window !== "undefined") return false;
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

/**
 * Supabase 환경 변수가 설정되었는지 여부 (UI에서 연동 안내용)
 */
export function isSupabaseConfigured(): boolean {
  try {
    getSupabaseEnv();
    return true;
  } catch {
    return false;
  }
}
