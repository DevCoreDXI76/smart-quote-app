/**
 * @file components/quote/QuoteEditor.tsx
 * @description 견적서 작성 화면 컨테이너 (폼·목록·합계·저장·출력)
 *
 * 로그인 후 sessionStorage(pending_quote_data)에 백업된 draft가 있으면
 * 자동 복구합니다. ?documentId= 불러오기는 복구보다 우선합니다.
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DocumentExportBar } from "@/components/document/DocumentExportBar";
import { fetchDocumentById } from "@/lib/supabase/fetchDocument";
import { useAuth } from "@/hooks/useAuth";
import { useQuoteCalculations } from "@/hooks/useQuoteCalculations";
import { useQuoteItems } from "@/hooks/useQuoteItems";
import {
  clearPendingQuoteDraft,
  loadPendingQuoteDraft,
} from "@/lib/quote/pendingQuoteStorage";

import { DocumentSavePanel } from "./DocumentSavePanel";
import { QuoteItemForm } from "./QuoteItemForm";
import { QuoteItemList } from "./QuoteItemList";
import { QuoteTotalsSummary } from "./QuoteTotalsSummary";

/**
 * 견적 품목 입력·목록·합계·저장·PDF 출력을 한 화면에 제공합니다.
 */
export function QuoteEditor() {
  const searchParams = useSearchParams();
  const documentIdFromUrl = searchParams.get("documentId");
  const { user, isLoading: authLoading } = useAuth();
  const pendingRestoredRef = useRef(false);

  const { items, addItem, removeItem, setItems } = useQuoteItems();
  const totals = useQuoteCalculations(items);
  const { lineTotals } = totals;

  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loadedDocumentId, setLoadedDocumentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  const loadDocument = useCallback(async (docId: string) => {
    setIsLoadingDoc(true);
    setLoadError(null);
    try {
      const doc = await fetchDocumentById(docId);
      if (!doc) {
        setLoadError("문서를 찾을 수 없습니다.");
        return;
      }
      setTitle(doc.title);
      setIsPublic(doc.isPublic);
      setLoadedDocumentId(doc.id);
      setItems(doc.items);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "문서 불러오기에 실패했습니다.",
      );
    } finally {
      setIsLoadingDoc(false);
    }
  }, [setItems]);

  useEffect(() => {
    if (!documentIdFromUrl) return;
    const timer = window.setTimeout(() => {
      void loadDocument(documentIdFromUrl);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [documentIdFromUrl, loadDocument]);

  /** 로그인 후 pending_quote_data 자동 복구 (URL 불러오기 우선) */
  useEffect(() => {
    if (authLoading || !user || documentIdFromUrl || pendingRestoredRef.current) {
      return;
    }

    const timer = window.setTimeout(() => {
      const draft = loadPendingQuoteDraft();
      if (!draft) return;

      setItems(draft.items);
      setTitle(draft.title);
      setIsPublic(draft.isPublic);
      setLoadedDocumentId(draft.loadedDocumentId);
      clearPendingQuoteDraft();
      pendingRestoredRef.current = true;
      setRestoreMessage(
        "로그인 전 작성하던 견적을 복구했습니다. [견적서 저장하기]를 다시 눌러 주세요.",
      );
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authLoading, user, documentIdFromUrl, setItems]);

  const handleSaved = useCallback((documentId: string) => {
    setLoadedDocumentId(documentId);
    setRestoreMessage(null);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {restoreMessage ? (
        <p
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
          role="status"
        >
          {restoreMessage}
        </p>
      ) : null}
      {isLoadingDoc ? (
        <p className="text-sm text-zinc-500">문서 불러오는 중...</p>
      ) : null}
      {loadError ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {loadError}
        </p>
      ) : null}
      {loadedDocumentId ? (
        <p className="text-sm text-blue-700 dark:text-blue-400">
          불러온 문서 ID: {loadedDocumentId} (수정 저장 시 동일 문서가 갱신됩니다)
        </p>
      ) : null}

      <QuoteItemForm onAdd={addItem} />
      <QuoteItemList items={items} lineTotals={lineTotals} onRemove={removeItem} />
      <QuoteTotalsSummary items={items} />
      <DocumentSavePanel
        items={items}
        title={title}
        onTitleChange={setTitle}
        isPublic={isPublic}
        onIsPublicChange={setIsPublic}
        loadedDocumentId={loadedDocumentId}
        onSaved={handleSaved}
      />
      <DocumentExportBar items={items} totals={totals} />
    </div>
  );
}
