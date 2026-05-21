/**
 * @file components/document/DocumentExportBar.tsx
 * @description 견적서·구매사양서 보기/다운로드 액션 바
 */

"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/common/Button";
import { PdfQuoteDocument } from "@/components/quote/PdfQuoteDocument";
import { PdfPurchaseSpecDocument } from "@/components/spec/PdfPurchaseSpecDocument";
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

  const hasItems = items.length > 0;

  const runOffscreenExport = useCallback(
    async (target: "quote" | "spec") => {
      if (!hasItems) return;

      clearError();
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
    [clearError, exportPdf, hasItems, items, totals],
  );

  return (
    <section
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
      aria-label="문서 출력"
    >
      <h2 className="mb-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        문서 출력
      </h2>
      <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
        품목을 추가한 뒤 견적서·구매사양서를 미리보기하거나 PDF로 저장할 수
        있습니다.
      </p>

      {!hasItems ? (
        <p className="mb-4 text-sm text-amber-700 dark:text-amber-400">
          품목을 1건 이상 추가한 뒤 문서를 생성할 수 있습니다.
        </p>
      ) : null}

      {error ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          variant="secondary"
          disabled={!hasItems || isExporting}
          onClick={() => setPreviewType("quote")}
        >
          견적서 보기
        </Button>
        <Button
          variant="primary"
          disabled={!hasItems || isExporting}
          isLoading={isExporting && downloadTarget === "quote"}
          loadingLabel="PDF 생성 중..."
          onClick={() => runOffscreenExport("quote")}
        >
          견적서 다운로드
        </Button>
        <Button
          variant="secondary"
          disabled={!hasItems || isExporting}
          onClick={() => setPreviewType("spec")}
        >
          구매사양서 보기
        </Button>
        <Button
          variant="primary"
          disabled={!hasItems || isExporting}
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
