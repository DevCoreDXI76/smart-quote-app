/**
 * @file app/shared/page.tsx
 * @description 공개 견적 공유 게시판
 */

"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Badge } from "@/components/common/Badge";
import { SharedDocumentPreviewModal } from "@/components/shared/SharedDocumentPreviewModal";
import {
  fetchDocumentById,
  fetchPublicDocuments,
} from "@/lib/supabase/fetchDocument";
import type { DocumentListItem } from "@/lib/supabase/mapDocument";
import type { DocumentMaster } from "@/types";

export default function SharedPage() {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<DocumentMaster | null>(null);
  const [previewAuthor, setPreviewAuthor] = useState<string | undefined>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [loadingPreview, setLoadingPreview] = useState(false);

  const loadBoard = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPublicDocuments(q || undefined);
      setDocuments(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "게시판을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadBoard(query);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [query, loadBoard]);

  const handleSearch = () => setQuery(search.trim());

  const openPreview = async (row: DocumentListItem) => {
    setLoadingPreview(true);
    try {
      const doc = await fetchDocumentById(row.id);
      if (!doc) {
        setError("문서를 찾을 수 없습니다.");
        return;
      }
      setPreviewDoc(doc);
      setPreviewAuthor(row.authorLabel);
      setPreviewOpen(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "미리보기 로드 실패",
      );
    } finally {
      setLoadingPreview(false);
    }
  };

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        공유 게시판
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        다른 사용자가 공개로 저장한 견적·구매사양 문서를 검색하고 볼 수
        있습니다.
      </p>

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="min-w-[240px] flex-1">
          <Input
            label="제목 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="문서 제목"
          />
        </div>
        <Button variant="primary" className="self-end" onClick={handleSearch}>
          검색
        </Button>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-sm text-zinc-500">목록 로딩 중...</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-zinc-500">공개 문서가 없습니다.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {documents.map((doc) => (
            <article
              key={doc.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h2 className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {doc.title}
                </h2>
                <Badge asSpan variant="primary">
                  공개
                </Badge>
              </div>
              <p className="mb-1 text-sm text-zinc-600 dark:text-zinc-400">
                작성자: {doc.authorLabel ?? "—"}
              </p>
              <p className="mb-4 text-sm text-zinc-500">
                품목 {doc.itemCount}건 ·{" "}
                {new Date(doc.createdAt).toLocaleDateString("ko-KR")}
              </p>
              <Button
                variant="secondary"
                disabled={loadingPreview}
                onClick={() => void openPreview(doc)}
              >
                보기
              </Button>
            </article>
          ))}
        </div>
      )}

      <SharedDocumentPreviewModal
        open={previewOpen}
        document={previewDoc}
        authorLabel={previewAuthor}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewDoc(null);
        }}
      />
    </div>
  );
}
