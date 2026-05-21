/**
 * @file components/quote/QuoteEditor.tsx
 * @description 견적서 작성 화면 컨테이너 (폼·목록·합계·저장·출력)
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { DocumentExportBar } from "@/components/document/DocumentExportBar";
import { fetchDocumentById } from "@/lib/supabase/fetchDocument";
import { useQuoteCalculations } from "@/hooks/useQuoteCalculations";
import { useQuoteItems } from "@/hooks/useQuoteItems";

import { DocumentSavePanel } from "./DocumentSavePanel";
import { QuoteItemForm } from "./QuoteItemForm";
import { QuoteItemList } from "./QuoteItemList";
import { QuoteTotalsSummary } from "./QuoteTotalsSummary";

/**
 * 견적 품목 입력·목록·합계·저장·PDF 출력을 한 화면에 제공합니다.
 * URL ?documentId= 로 대시보드에서 불러오기를 지원합니다.
 */
export function QuoteEditor() {
  const searchParams = useSearchParams();
  const documentIdFromUrl = searchParams.get("documentId");

  const { items, addItem, removeItem, setItems } = useQuoteItems();
  const totals = useQuoteCalculations(items);
  const { lineTotals } = totals;

  const [title, setTitle] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [loadedDocumentId, setLoadedDocumentId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);

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

  const handleSaved = useCallback((documentId: string) => {
    setLoadedDocumentId(documentId);
  }, []);

  return (
    <div className="flex flex-col gap-8">
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
