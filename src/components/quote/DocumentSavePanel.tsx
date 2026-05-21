/**
 * @file components/quote/DocumentSavePanel.tsx
 * @description 견적서 저장(제목, 공개 여부, Supabase RPC)
 */

"use client";

import { useCallback, useState } from "react";

import { AuthModal } from "@/components/auth/AuthModal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";
import { useSaveDocument } from "@/hooks/useSaveDocument";
import type { QuoteItem } from "@/types";

export interface DocumentSavePanelProps {
  items: QuoteItem[];
  title: string;
  onTitleChange: (title: string) => void;
  isPublic: boolean;
  onIsPublicChange: (value: boolean) => void;
  loadedDocumentId: string | null;
  onSaved: (documentId: string) => void;
}

/**
 * 문서 제목·공개 설정 및 [견적서 저장하기] 버튼
 */
export function DocumentSavePanel({
  items,
  title,
  onTitleChange,
  isPublic,
  onIsPublicChange,
  loadedDocumentId,
  onSaved,
}: DocumentSavePanelProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { saveDocument, isSaving, error, clearError } = useSaveDocument();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const hasItems = items.length > 0;
  const saveLabel = loadedDocumentId ? "수정 저장" : "견적서 저장하기";

  const runSave = useCallback(async () => {
    clearError();
    setSuccessMessage(null);

    const docTitle = title.trim() || `견적서 ${new Date().toLocaleDateString("ko-KR")}`;

    const id = await saveDocument({
      title: docTitle,
      isPublic,
      items,
      documentId: loadedDocumentId,
    });

    onSaved(id);
    setSuccessMessage(
      loadedDocumentId
        ? "문서가 수정 저장되었습니다."
        : "문서가 저장되었습니다.",
    );
  }, [
    clearError,
    title,
    isPublic,
    items,
    loadedDocumentId,
    saveDocument,
    onSaved,
  ]);

  const handleSaveClick = () => {
    if (!hasItems) return;
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    void runSave();
  };

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      aria-label="문서 저장"
    >
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        문서 저장
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        작성한 견적을 Supabase에 저장합니다. 공개로 저장하면 공유 게시판에
        노출됩니다.
      </p>

      <div className="mb-4 flex flex-col gap-4">
        <Input
          label="문서 제목"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="예: 2026년 5월 IT 장비 견적"
        />
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-zinc-300"
            checked={isPublic}
            onChange={(e) => onIsPublicChange(e.target.checked)}
          />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">공개 문서로 저장</span>
            <span className="mt-1 block text-zinc-500 dark:text-zinc-400">
              체크 시 다른 사용자가 공유 게시판에서 이 견적을 볼 수 있습니다.
            </span>
          </span>
        </label>
      </div>

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      {successMessage ? (
        <p className="mb-4 text-sm text-green-700 dark:text-green-400">
          {successMessage}
        </p>
      ) : null}

      <Button
        variant="primary"
        disabled={!hasItems || isSaving || authLoading}
        isLoading={isSaving}
        loadingLabel="저장 중..."
        onClick={handleSaveClick}
      >
        {saveLabel}
      </Button>

      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => void runSave()}
      />
    </section>
  );
}
