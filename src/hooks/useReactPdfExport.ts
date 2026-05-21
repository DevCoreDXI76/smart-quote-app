/**
 * @file hooks/useReactPdfExport.ts
 * @description @react-pdf/renderer 기반 PDF 생성·다운로드 훅 (pdf().toBlob)
 */

"use client";

import { pdf } from "@react-pdf/renderer";
import { useCallback, useState } from "react";
import type { ReactElement } from "react";
import type { DocumentProps } from "@react-pdf/renderer";

export interface ExportReactPdfParams {
  document: ReactElement<DocumentProps>;
  filename: string;
}

export interface UseReactPdfExportResult {
  exportPdf: (params: ExportReactPdfParams) => Promise<boolean>;
  isExporting: boolean;
  error: string | null;
  clearError: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function useReactPdfExport(): UseReactPdfExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const exportPdf = useCallback(
    async ({ document: doc, filename }: ExportReactPdfParams): Promise<boolean> => {
      setIsExporting(true);
      setError(null);
      try {
        const blob = await pdf(doc).toBlob();
        downloadBlob(blob, filename);
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "PDF 생성 중 알 수 없는 오류가 발생했습니다.";
        setError(message);
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportPdf, isExporting, error, clearError };
}

