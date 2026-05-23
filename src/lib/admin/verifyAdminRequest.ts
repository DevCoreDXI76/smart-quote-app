/**
 * @file lib/admin/verifyAdminRequest.ts
 * @description /api/admin/* Route Handler 공통 — admin 세션 검증
 *
 * [보안 가이드]
 * - 모든 admin API 진입점에서 반드시 호출하세요.
 * - 미들웨어를 우회한 API 직접 호출(curl 등)도 여기서 차단됩니다.
 * - service role 호출 전에 이 함수로 caller가 admin인지 확인하세요.
 */

import { createServerSupabaseClient } from "@/lib/supabase/serverClient";
import type { UserRole } from "@/types";

export interface VerifiedAdmin {
  userId: string;
  email: string;
  role: UserRole;
}

export class AdminAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * 현재 요청이 admin 세션인지 검증합니다.
 * @throws AdminAuthError 401/403
 */
export async function verifyAdminRequest(): Promise<VerifiedAdmin> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new AdminAuthError("로그인이 필요합니다.", 401);
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, email")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || profile.role !== "admin") {
    throw new AdminAuthError("관리자 권한이 필요합니다.", 403);
  }

  return {
    userId: user.id,
    email: user.email ?? profile.email,
    role: "admin",
  };
}

/**
 * AdminAuthError → JSON Response
 */
export function adminErrorResponse(err: unknown): Response {
  if (err instanceof AdminAuthError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message =
    err instanceof Error ? err.message : "관리자 API 처리 중 오류가 발생했습니다.";
  return Response.json({ error: message }, { status: 500 });
}
