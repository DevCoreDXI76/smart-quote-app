/**
 * @file app/dashboard/page.tsx
 * @description 마이페이지 — 내 문서 목록·불러오기·비교 선택
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { fetchMyDocuments } from "@/lib/supabase/fetchDocument";
import { fetchDocumentTotalAmounts } from "@/lib/supabase/fetchProductsBatch";
import type { DocumentListItem } from "@/lib/supabase/mapDocument";
import { formatKRW } from "@/lib/format/currency";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [totalByDoc, setTotalByDoc] = useState<Map<string, number>>(new Map());
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadList = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await fetchMyDocuments(user.id);
      setDocuments(list);
      const totals = await fetchDocumentTotalAmounts(list.map((d) => d.id));
      setTotalByDoc(totals);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "목록을 불러오지 못했습니다.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) return;
    const timer = window.setTimeout(() => {
      void loadList();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authLoading, user, loadList]);

  useEffect(() => {
    if (authLoading || user) return;
    router.replace("/login?redirect=/dashboard");
  }, [authLoading, user, router]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, search]);

  const toggleCompare = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const goCompare = () => {
    if (selectedIds.length !== 2) return;
    router.push(
      `/dashboard/compare?a=${selectedIds[0]}&b=${selectedIds[1]}`,
    );
  };

  if (authLoading || (!user && !loadError)) {
    return <p className="text-sm text-zinc-500">확인 중...</p>;
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        마이페이지
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        저장한 견적 문서를 관리하고, 두 문서의 금액·사양을 비교할 수 있습니다.
      </p>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[200px] flex-1">
          <Input
            label="제목 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="문서 제목으로 필터"
          />
        </div>
        <Button
          variant="secondary"
          disabled={selectedIds.length !== 2}
          onClick={goCompare}
        >
          비교하기 (2건 선택)
        </Button>
        <Link href="/">
          <Button variant="primary">새 견적 작성</Button>
        </Link>
      </div>

      {loadError ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {loadError}
        </p>
      ) : null}

      {isLoading ? (
        <p className="text-sm text-zinc-500">목록 로딩 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-zinc-500">저장된 문서가 없습니다.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">비교</th>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">공개</th>
                <th className="px-4 py-3 font-medium">품목 수</th>
                <th className="px-4 py-3 font-medium">총 합계</th>
                <th className="px-4 py-3 font-medium">생성일</th>
                <th className="px-4 py-3 font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((doc) => (
                <tr
                  key={doc.id}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleCompare(doc.id)}
                      aria-label={`${doc.title} 비교 선택`}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                    {doc.title}
                  </td>
                  <td className="px-4 py-3">
                    {doc.isPublic ? (
                      <Badge asSpan variant="primary">
                        공개
                      </Badge>
                    ) : (
                      <Badge asSpan variant="outline">
                        비공개
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">{doc.itemCount}</td>
                  <td className="px-4 py-3">
                    {formatKRW(totalByDoc.get(doc.id) ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {new Date(doc.createdAt).toLocaleString("ko-KR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/?documentId=${doc.id}`}
                      className="text-sm font-medium text-blue-600 underline dark:text-blue-400"
                    >
                      불러오기
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
