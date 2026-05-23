/**
 * @file app/api/admin/documents/[id]/route.ts
 * @description 관리자 — 유해 문서 삭제 (admin_delete_document RPC)
 *
 * [보안 가이드]
 * - verifyAdminRequest() 필수
 * - service role 불필요 — admin RPC + RLS
 */

import {
  adminErrorResponse,
  verifyAdminRequest,
} from "@/lib/admin/verifyAdminRequest";
import { createServerSupabaseClient } from "@/lib/supabase/serverClient";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await verifyAdminRequest();
    const { id: documentId } = await context.params;

    if (!documentId) {
      return Response.json({ error: "문서 ID가 필요합니다." }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc("admin_delete_document", {
      p_document_id: documentId,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    return Response.json({ success: true });
  } catch (err) {
    return adminErrorResponse(err);
  }
}
