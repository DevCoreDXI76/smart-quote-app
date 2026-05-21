/**
 * @file components/shared/SharedDocumentPreviewModal.tsx
 * @description 공유 게시판 읽기 전용 문서 미리보기
 */

"use client";

import { useMemo } from "react";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { PdfQuoteDocument } from "@/components/quote/PdfQuoteDocument";
import { PdfPurchaseSpecDocument } from "@/components/spec/PdfPurchaseSpecDocument";
import { useReactPdfExport } from "@/hooks/useReactPdfExport";
import {
  buildDocumentMeta,
  formatFilenameDate,
} from "@/lib/document/buildDocumentMeta";
import { calculateQuoteTotals } from "@/lib/calculations/quoteTotals";
import { formatKRW } from "@/lib/format/currency";
import type { DocumentMaster } from "@/types";

export interface SharedDocumentPreviewModalProps {
  open: boolean;
  document: DocumentMaster | null;
  authorLabel?: string;
  onClose: () => void;
}

/**
 * 공개 문서 품목 목록 + PDF 다운로드(읽기 전용)
 */
export function SharedDocumentPreviewModal({
  open,
  document,
  authorLabel,
  onClose,
}: SharedDocumentPreviewModalProps) {
  const { exportPdf, isExporting } = useReactPdfExport();

  const totals = useMemo(
    () => (document ? calculateQuoteTotals(document.items) : null),
    [document],
  );

  if (!document) return null;

  const meta = buildDocumentMeta();
  const dateKey = formatFilenameDate(meta.issuedAt);

  const downloadQuote = () =>
    void exportPdf({
      document: (
        <PdfQuoteDocument
          items={document.items}
          totals={totals!}
          issuedAt={meta.issuedAt}
          documentNo={meta.documentNo}
        />
      ),
      filename: `견적서_${dateKey}.pdf`,
    });

  const downloadSpec = () =>
    void exportPdf({
      document: (
        <PdfPurchaseSpecDocument
          items={document.items}
          issuedAt={meta.issuedAt}
          documentNo={meta.documentNo}
        />
      ),
      filename: `구매사양서_${dateKey}.pdf`,
    });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={document.title}
      footer={
        <>
          <Button
            variant="secondary"
            disabled={isExporting}
            onClick={downloadQuote}
          >
            견적서 PDF
          </Button>
          <Button
            variant="secondary"
            disabled={isExporting}
            onClick={downloadSpec}
          >
            구매사양서 PDF
          </Button>
          <Button variant="primary" onClick={onClose}>
            닫기
          </Button>
        </>
      }
    >
      <div className="rounded-lg bg-white p-6 dark:bg-zinc-900">
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          작성자: {authorLabel ?? "—"} · 품목 {document.items.length}건 · 총합{" "}
          {totals ? formatKRW(totals.totalAmount) : "—"}
        </p>
        <ul className="max-h-64 space-y-3 overflow-auto text-sm">
          {document.items.map((item, i) => (
            <li
              key={item.id}
              className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-700"
            >
              <p className="font-medium">
                {i + 1}. {item.productName} ({item.manufacturer})
              </p>
              <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                단가 {formatKRW(item.unitPrice)} × {item.quantity}
              </p>
              {item.detailedSpec ? (
                <p className="mt-1 line-clamp-3 text-zinc-500">
                  {item.detailedSpec}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
