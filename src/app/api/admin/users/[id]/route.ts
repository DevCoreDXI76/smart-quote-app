/**
 * @file app/api/admin/users/[id]/route.ts
 * @description 관리자 — 사용자 강제 탈퇴 (auth.users 삭제)
 *
 * [보안 가이드]
 * - verifyAdminRequest()로 admin 검증 후에만 service role 호출
 * - SUPABASE_SERVICE_ROLE_KEY는 이 Route Handler(서버)에서만 사용
 * - 클라이언트·브라우저·NEXT_PUBLIC_* 에 키 노출 금지
 * - 본인 계정 삭제 방지
 */

import {
  adminErrorResponse,
  verifyAdminRequest,
} from "@/lib/admin/verifyAdminRequest";
import { isServiceRoleConfigured } from "@/lib/supabase/env";
import { getServiceRoleClient } from "@/lib/supabase/serviceRoleClient";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const admin = await verifyAdminRequest();
    const { id: targetUserId } = await context.params;

    if (!targetUserId) {
      return Response.json({ error: "사용자 ID가 필요합니다." }, { status: 400 });
    }

    if (targetUserId === admin.userId) {
      return Response.json(
        { error: "자신의 계정은 강제 탈퇴할 수 없습니다." },
        { status: 400 },
      );
    }

    if (!isServiceRoleConfigured()) {
      return Response.json(
        {
          error:
            "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local을 확인해 주세요.",
        },
        { status: 503 },
      );
    }

    const serviceClient = getServiceRoleClient();
    const { error } = await serviceClient.auth.admin.deleteUser(targetUserId);

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
