/**
 * @file lib/supabase/env.ts
 * @description Supabase 클라이언트용 환경 변수 읽기·검증
 */

export interface SupabaseEnv {
  url: string;
  anonKey: string;
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
