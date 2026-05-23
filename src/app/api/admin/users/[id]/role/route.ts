/**
 * @file app/api/admin/users/[id]/role/route.ts
 * @description 관리자 — 사용자 role 변경 (admin_set_user_role RPC)
 *
 * [보안 가이드]
 * - verifyAdminRequest() 필수
 * - service role 불필요 — caller JWT + admin RPC가 RLS·트리거를 통과
 * - role 변경은 프론트에서 Supabase 직접 UPDATE 금지
 */

import {
  adminErrorResponse,
  verifyAdminRequest,
} from "@/lib/admin/verifyAdminRequest";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";
import type { UserRole } from "@/types";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await verifyAdminRequest();
    const { id: targetUserId } = await context.params;

    if (!targetUserId) {
      return Response.json({ error: "사용자 ID가 필요합니다." }, { status: 400 });
    }

    const body = (await request.json()) as { role?: UserRole };
    const role = body.role;

    if (role !== "user" && role !== "admin") {
      return Response.json(
        { error: "role은 user 또는 admin만 가능합니다." },
        { status: 400 },
      );
    }

    if (targetUserId === admin.userId && role === "user") {
      return Response.json(
        { error: "자신의 admin 권한은 해제할 수 없습니다." },
        { status: 400 },
      );
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("admin_set_user_role", {
      p_user_id: targetUserId,
      p_role: role,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true, role });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
