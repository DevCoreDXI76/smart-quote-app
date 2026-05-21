/**
 * @file components/document/DocumentPreviewModal.tsx
 * @description 견적서·구매사양서 미리보기 모달
 */

"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { PDFViewer } from "@react-pdf/renderer";

import { PdfQuoteDocument } from "@/components/quote/PdfQuoteDocument";
import { PdfPurchaseSpecDocument } from "@/components/spec/PdfPurchaseSpecDocument";
import { useReactPdfExport } from "@/hooks/useReactPdfExport";
import {
  buildDocumentMeta,
  formatFilenameDate,
} from "@/lib/document/buildDocumentMeta";
import type { QuoteTotals } from "@/lib/calculations/quoteTotals";
import type { QuoteItem } from "@/types";

export type DocumentPreviewType = "quote" | "spec";

export interface DocumentPreviewModalProps {
  open: boolean;
  type: DocumentPreviewType;
  items: QuoteItem[];
  totals: QuoteTotals;
  onClose: () => void;
}

/**
 * 문서 미리보기 + PDF 다운로드 모달
 */
export function DocumentPreviewModal({
  open,
  type,
  items,
  totals,
  onClose,
}: DocumentPreviewModalProps) {
  const { exportPdf, isExporting, error, clearError } = useReactPdfExport();
  const meta = buildDocumentMeta();

  const isQuote = type === "quote";
  const title = isQuote ? "견적서 미리보기" : "구매사양서 미리보기";
  const dateKey = formatFilenameDate(meta.issuedAt);
  const filename = isQuote
    ? `견적서_${dateKey}.pdf`
    : `구매사양서_${dateKey}.pdf`;

  const handleDownload = async () => {
    clearError();
    const ok = await exportPdf({
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
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          {error ? (
            <p className="mr-auto text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            닫기
          </Button>
          <Button
            variant="primary"
            onClick={handleDownload}
            isLoading={isExporting}
            loadingLabel="PDF 생성 중..."
          >
            PDF 다운로드
          </Button>
        </>
      }
    >
      <div className="h-[80vh] w-full">
        <PDFViewer width="100%" height="100%" showToolbar>
          {isQuote ? (
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
          )}
        </PDFViewer>
      </div>
    </Modal>
  );
}
