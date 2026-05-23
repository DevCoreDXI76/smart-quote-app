/**
 * @file app/admin/page.tsx
 * @description 관리자 전용 사용자·문서 관리 대시보드
 *
 * [보안 가이드]
 * - middleware가 /admin edge 차단 (non-admin → /)
 * - 이 페이지의 isAdmin 가드는 UX 보조용 이중 방어
 * - role 변경·탈퇴·문서 삭제는 /api/admin/* 또는 admin RPC만 사용
 * - SUPABASE_SERVICE_ROLE_KEY는 브라우저에 노출되지 않음 (강제 탈퇴만 서버 API)
 */

"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/hooks/useAuth";
import {
  deleteAdminDocument,
  deleteAdminUser,
  fetchAdminDocumentStats,
  fetchAdminDocuments,
  fetchAdminUsers,
  patchAdminUserRole,
  type AdminDocumentRow,
  type AdminDocumentStats,
  type AdminUserRow,
} from "@/lib/admin/fetchAdminData";
import type { UserRole } from "@/types";

type AdminTab = "users" | "documents";

export default function AdminPage() {
  const router = useRouter();
  const { user, isAdmin, isLoading, profileLoading, refreshProfile } = useAuth();

  const [tab, setTab] = useState<AdminTab>("users");
  const [stats, setStats] = useState<AdminDocumentStats | null>(null);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [documents, setDocuments] = useState<AdminDocumentRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [pendingRole, setPendingRole] = useState<Record<string, UserRole>>({});
  const [confirmModal, setConfirmModal] = useState<
    | { type: "deleteUser"; user: AdminUserRow }
    | { type: "deleteDocument"; doc: AdminDocumentRow }
    | null
  >(null);
  const [isActioning, setIsActioning] = useState(false);

  const loadAll = useCallback(async () => {
    setIsLoadingData(true);
    setLoadError(null);
    try {
      const [statsData, usersData, docsData] = await Promise.all([
        fetchAdminDocumentStats(),
        fetchAdminUsers(),
        fetchAdminDocuments(),
      ]);
      setStats(statsData);
      setUsers(usersData);
      setDocuments(docsData);
      setPendingRole(
        Object.fromEntries(usersData.map((u) => [u.id, u.role])),
      );
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "관리자 데이터를 불러오지 못했습니다.",
      );
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (isLoading || profileLoading) return;
    if (!user || !isAdmin) {
      router.replace("/");
      return;
    }
    const timer = window.setTimeout(() => {
      void loadAll();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isLoading, profileLoading, user, isAdmin, router, loadAll]);

  const handleRoleChange = async (target: AdminUserRow) => {
    const role = pendingRole[target.id] ?? target.role;
    if (role === target.role) return;

    setActionError(null);
    setIsActioning(true);
    try {
      await patchAdminUserRole(target.id, role);
      await loadAll();
      if (target.id === user?.id) await refreshProfile();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "권한 변경에 실패했습니다.",
      );
    } finally {
      setIsActioning(false);
    }
  };

  const handleConfirmAction = async () => {
    if (!confirmModal) return;
    setActionError(null);
    setIsActioning(true);
    try {
      if (confirmModal.type === "deleteUser") {
        await deleteAdminUser(confirmModal.user.id);
      } else {
        await deleteAdminDocument(confirmModal.doc.id);
      }
      setConfirmModal(null);
      await loadAll();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "작업에 실패했습니다.",
      );
    } finally {
      setIsActioning(false);
    }
  };

  if (isLoading || profileLoading) {
    return (
      <p className="text-center text-sm text-zinc-500">관리자 권한 확인 중...</p>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          관리자 대시보드
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          가입 사용자·전체 문서를 관리합니다. 모든 작업은 서버 API·DB RLS로
          검증됩니다.
        </p>
      </div>

      {stats ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard label="전체 가입자" value={stats.totalUsers} />
          <StatCard label="전체 문서" value={stats.totalDocuments} />
          <StatCard label="오늘 발행 문서" value={stats.todayDocuments} />
        </div>
      ) : null}

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700">
        <TabButton
          active={tab === "users"}
          onClick={() => setTab("users")}
          label="가입된 사용자 관리"
        />
        <TabButton
          active={tab === "documents"}
          onClick={() => setTab("documents")}
          label="전체 발행 문서 관리"
        />
      </div>

      {loadError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}
      {actionError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {actionError}
        </p>
      ) : null}

      {isLoadingData ? (
        <p className="text-sm text-zinc-500">데이터 불러오는 중...</p>
      ) : tab === "users" ? (
        <UsersTable
          users={users}
          currentUserId={user?.id ?? ""}
          pendingRole={pendingRole}
          isActioning={isActioning}
          onRoleSelect={(id, role) =>
            setPendingRole((prev) => ({ ...prev, [id]: role }))
          }
          onRoleChange={handleRoleChange}
          onDeleteRequest={(u) => setConfirmModal({ type: "deleteUser", user: u })}
        />
      ) : (
        <DocumentsTable
          documents={documents}
          isActioning={isActioning}
          onDeleteRequest={(d) =>
            setConfirmModal({ type: "deleteDocument", doc: d })
          }
        />
      )}

      <Modal
        open={confirmModal !== null}
        onClose={() => setConfirmModal(null)}
        title={
          confirmModal?.type === "deleteUser"
            ? "강제 탈퇴 확인"
            : "문서 삭제 확인"
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmModal(null)}>
              취소
            </Button>
            <Button
              variant="primary"
              isLoading={isActioning}
              loadingLabel="처리 중..."
              onClick={() => void handleConfirmAction()}
            >
              {confirmModal?.type === "deleteUser" ? "강제 탈퇴" : "삭제"}
            </Button>
          </>
        }
      >
        {confirmModal?.type === "deleteUser" ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            <strong>{confirmModal.user.email}</strong> 계정을 삭제합니다.
            auth.users 및 연관 데이터가 제거됩니다. 이 작업은 되돌릴 수 없습니다.
          </p>
        ) : confirmModal?.type === "deleteDocument" ? (
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            「{confirmModal.doc.title}」 문서를 삭제합니다. 포함 품목도 함께
            삭제됩니다.
          </p>
        ) : null}
      </Modal>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {value.toLocaleString("ko-KR")}
      </p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-50"
          : "border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400"
      }`}
    >
      {label}
    </button>
  );
}

function UsersTable({
  users,
  currentUserId,
  pendingRole,
  isActioning,
  onRoleSelect,
  onRoleChange,
  onDeleteRequest,
}: {
  users: AdminUserRow[];
  currentUserId: string;
  pendingRole: Record<string, UserRole>;
  isActioning: boolean;
  onRoleSelect: (id: string, role: UserRole) => void;
  onRoleChange: (user: AdminUserRow) => void;
  onDeleteRequest: (user: AdminUserRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">이메일</th>
            <th className="px-4 py-3 font-medium">가입일</th>
            <th className="px-4 py-3 font-medium">역할</th>
            <th className="px-4 py-3 font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const selectedRole = pendingRole[u.id] ?? u.role;
            const isSelf = u.id === currentUserId;
            return (
              <tr
                key={u.id}
                className="border-b border-zinc-100 dark:border-zinc-800"
              >
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                  {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-3">
                  <Badge asSpan variant={u.role === "admin" ? "primary" : "default"}>
                    {u.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                      value={selectedRole}
                      disabled={isSelf}
                      onChange={(e) =>
                        onRoleSelect(u.id, e.target.value as UserRole)
                      }
                    >
                      <option value="user">user</option>
                      <option value="admin">admin</option>
                    </select>
                    <Button
                      variant="secondary"
                      disabled={
                        isActioning || isSelf || selectedRole === u.role
                      }
                      onClick={() => void onRoleChange(u)}
                    >
                      권한 변경
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={isActioning || isSelf}
                      onClick={() => onDeleteRequest(u)}
                    >
                      강제 탈퇴
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function DocumentsTable({
  documents,
  isActioning,
  onDeleteRequest,
}: {
  documents: AdminDocumentRow[];
  isActioning: boolean;
  onDeleteRequest: (doc: AdminDocumentRow) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
          <tr>
            <th className="px-4 py-3 font-medium">제목</th>
            <th className="px-4 py-3 font-medium">작성자</th>
            <th className="px-4 py-3 font-medium">공개</th>
            <th className="px-4 py-3 font-medium">생성일</th>
            <th className="px-4 py-3 font-medium">관리</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((d) => (
            <tr
              key={d.id}
              className="border-b border-zinc-100 dark:border-zinc-800"
            >
              <td className="px-4 py-3">{d.title}</td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {d.userEmail}
              </td>
              <td className="px-4 py-3">
                <Badge asSpan variant={d.isPublic ? "primary" : "default"}>
                  {d.isPublic ? "공개" : "비공개"}
                </Badge>
              </td>
              <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                {new Date(d.createdAt).toLocaleDateString("ko-KR")}
              </td>
              <td className="px-4 py-3">
                <Button
                  variant="secondary"
                  disabled={isActioning}
                  onClick={() => onDeleteRequest(d)}
                >
                  삭제
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
