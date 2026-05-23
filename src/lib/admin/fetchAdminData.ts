/**
 * @file lib/admin/fetchAdminData.ts
 * @description 관리자 대시보드 데이터 fetch (anon key + admin RPC)
 *
 * [보안 가이드]
 * - admin JWT가 아니면 RPC에서 거부됩니다.
 * - service role key는 사용하지 않습니다.
 */

import { getSupabaseClient } from "@/lib/supabaseClient";
import type { UserRole } from "@/types";

export interface AdminUserRow {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AdminDocumentRow {
  id: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  userEmail: string;
}

export interface AdminDocumentStats {
  totalDocuments: number;
  todayDocuments: number;
  totalUsers: number;
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row: {
      id: string;
      email: string;
      display_name: string | null;
      role: string;
      created_at: string;
    }) => ({
      id: row.id,
      email: row.email,
      displayName: row.display_name,
      role: row.role === "admin" ? "admin" : "user",
      createdAt: row.created_at,
    }),
  );
}

export async function fetchAdminDocumentStats(): Promise<AdminDocumentStats> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_document_stats");

  if (error) throw new Error(error.message);

  const stats = data as {
    total_documents: number;
    today_documents: number;
    total_users: number;
  };

  return {
    totalDocuments: Number(stats.total_documents ?? 0),
    todayDocuments: Number(stats.today_documents ?? 0),
    totalUsers: Number(stats.total_users ?? 0),
  };
}

export async function fetchAdminDocuments(
  limit = 100,
): Promise<AdminDocumentRow[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc("admin_list_documents", {
    p_limit: limit,
  });

  if (error) throw new Error(error.message);

  return (data ?? []).map(
    (row: {
      id: string;
      title: string;
      is_public: boolean;
      created_at: string;
      user_id: string;
      user_email: string;
    }) => ({
      id: row.id,
      title: row.title,
      isPublic: row.is_public,
      createdAt: row.created_at,
      userId: row.user_id,
      userEmail: row.user_email,
    }),
  );
}

/**
 * 관리자 API — role 변경
 */
export async function patchAdminUserRole(
  userId: string,
  role: UserRole,
): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? "권한 변경에 실패했습니다.");
}

/**
 * 관리자 API — 강제 탈퇴 (service role, 서버 Route Handler)
 */
export async function deleteAdminUser(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? "강제 탈퇴에 실패했습니다.");
}

/**
 * 관리자 API — 문서 삭제
 */
export async function deleteAdminDocument(documentId: string): Promise<void> {
  const res = await fetch(`/api/admin/documents/${documentId}`, {
    method: "DELETE",
  });
  const json = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(json.error ?? "문서 삭제에 실패했습니다.");
}
