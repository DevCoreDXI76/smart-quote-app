/**
 * @file hooks/useExcelExport.ts
 * @description exceljs + file-saver 기반 견적서 xlsx 다운로드 훅
 *
 * [사용처]
 * - DocumentExportBar [엑셀 파일 다운로드] 버튼
 * - buildQuoteWorkbook → writeBuffer → saveAs (브라우저 전용)
 */

"use client";

import { saveAs } from "file-saver";
import { useCallback, useState } from "react";

import { buildDocumentMeta } from "@/lib/document/buildDocumentMeta";
import { buildQuoteWorkbook } from "@/lib/excel/buildQuoteWorkbook";
import type { SupplierInfo } from "@/types/document";
import type { QuoteItem } from "@/types";

export interface ExportExcelQuoteParams {
  items: QuoteItem[];
  filename: string;
  supplier?: SupplierInfo;
}

export interface UseExcelExportResult {
  exportExcelQuote: (params: ExportExcelQuoteParams) => Promise<boolean>;
  isExporting: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * 견적서 xlsx 생성·다운로드 훅
 */
export function useExcelExport(): UseExcelExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const exportExcelQuote = useCallback(
    async ({
      items,
      filename,
      supplier,
    }: ExportExcelQuoteParams): Promise<boolean> => {
      if (items.length === 0) {
        setError("품목을 1건 이상 추가한 뒤 엑셀을 다운로드할 수 있습니다.");
        return false;
      }

      setIsExporting(true);
      setError(null);

      try {
        const meta = buildDocumentMeta();
        const workbook = await buildQuoteWorkbook({
          items,
          meta,
          supplier,
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        saveAs(blob, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "엑셀 파일 생성 중 알 수 없는 오류가 발생했습니다.";
        setError(message);
        return false;
      } finally {
        setIsExporting(false);
      }
    },
    [],
  );

  return { exportExcelQuote, isExporting, error, clearError };
}
