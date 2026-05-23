/**
 * @file components/document/DocumentExportBar.tsx
 * @description 견적서·구매사양서 보기/다운로드 액션 바
 */

"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/common/Button";
import { PdfQuoteDocument } from "@/components/quote/PdfQuoteDocument";
import { PdfPurchaseSpecDocument } from "@/components/spec/PdfPurchaseSpecDocument";
import { useExcelExport } from "@/hooks/useExcelExport";
import { useReactPdfExport } from "@/hooks/useReactPdfExport";
import {
  buildDocumentMeta,
  formatFilenameDate,
} from "@/lib/document/buildDocumentMeta";
import type { QuoteTotals } from "@/lib/calculations/quoteTotals";
import type { QuoteItem } from "@/types";

import {
  DocumentPreviewModal,
  type DocumentPreviewType,
} from "./DocumentPreviewModal";

export interface DocumentExportBarProps {
  items: QuoteItem[];
  totals: QuoteTotals;
}

/**
 * 문서 출력 버튼 4종 + 오프스크린 PDF 렌더
 */
export function DocumentExportBar({ items, totals }: DocumentExportBarProps) {
  const [previewType, setPreviewType] = useState<DocumentPreviewType | null>(
    null,
  );
  const [downloadTarget, setDownloadTarget] = useState<"quote" | "spec" | null>(
    null,
  );
  const { exportPdf, isExporting, error, clearError } = useReactPdfExport();
  const {
    exportExcelQuote,
    isExporting: isExcelExporting,
    error: excelError,
    clearError: clearExcelError,
  } = useExcelExport();

  const hasItems = items.length > 0;
  const isBusy = isExporting || isExcelExporting;
  const displayError = error ?? excelError;

  const runOffscreenExport = useCallback(
    async (target: "quote" | "spec") => {
      if (!hasItems) return;

      clearError();
      clearExcelError();
      setDownloadTarget(target);

      const meta = buildDocumentMeta();
      const isQuote = target === "quote";
      const dateKey = formatFilenameDate(meta.issuedAt);
      const filename = isQuote
        ? `견적서_${dateKey}.pdf`
        : `구매사양서_${dateKey}.pdf`;

      await exportPdf({
        document: isQuote ? (
          <PdfQuoteDocument
            items={items}
            totals={totals}
            issuedAt={meta.issuedAt}
            documentNo={meta.documentNo}
          />
        ) : (
          <PdfPurchaseSpecDocument
            items={items}
            issuedAt={meta.issuedAt}
            documentNo={meta.documentNo}
          />
        ),
        filename,
      });
      setDownloadTarget(null);
    },
    [clearError, clearExcelError, exportPdf, hasItems, items, totals],
  );

  const runExcelExport = useCallback(async () => {
    if (!hasItems) return;

    clearError();
    clearExcelError();

    const meta = buildDocumentMeta();
    const dateKey = formatFilenameDate(meta.issuedAt);
    await exportExcelQuote({
      items,
      filename: `견적서_${dateKey}.xlsx`,
    });
  }, [exportExcelQuote, clearError, clearExcelError, hasItems, items]);

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      aria-label="문서 출력"
    >
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        문서 출력
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        품목을 추가한 뒤 견적서·구매사양서를 미리보기하거나 PDF·엑셀로 저장할 수
        있습니다.
      </p>

      {!hasItems ? (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
          품목을 1건 이상 추가한 뒤 문서를 생성할 수 있습니다.
        </p>
      ) : null}

      {displayError ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {displayError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={!hasItems || isBusy}
          onClick={() => setPreviewType("quote")}
        >
          견적서 보기
        </Button>
        <Button
          variant="primary"
          disabled={!hasItems || isBusy}
          isLoading={isExporting && downloadTarget === "quote"}
          loadingLabel="PDF 생성 중..."
          onClick={() => runOffscreenExport("quote")}
        >
          견적서 다운로드
        </Button>
        <Button
          variant="secondary"
          disabled={!hasItems || isBusy}
          isLoading={isExcelExporting}
          loadingLabel="엑셀 생성 중..."
          className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 dark:border-emerald-600 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-700"
          onClick={() => void runExcelExport()}
        >
          엑셀 파일 다운로드 (.xlsx)
        </Button>
        <Button
          variant="secondary"
          disabled={!hasItems || isBusy}
          onClick={() => setPreviewType("spec")}
        >
          구매사양서 보기
        </Button>
        <Button
          variant="primary"
          disabled={!hasItems || isBusy}
          isLoading={isExporting && downloadTarget === "spec"}
          loadingLabel="PDF 생성 중..."
          onClick={() => runOffscreenExport("spec")}
        >
          구매사양서 다운로드
        </Button>
      </div>

      {previewType ? (
        <DocumentPreviewModal
          open
          type={previewType}
          items={items}
          totals={totals}
          onClose={() => setPreviewType(null)}
        />
      ) : null}
    </section>
  );
}
