/**
 * @file lib/excel/buildQuoteWorkbook.ts
 * @description exceljs 기반 표준 견적서 워크북 생성 (수식·스타일)
 *
 * [시트 레이아웃 — 행/열 좌표]
 * - 열 A~G: No | 품명 | 모델명 | 제조사 | 수량(E) | 단가(F) | 금액(G)
 * - 1행: 견적서 타이틀 (A1:G1 병합)
 * - 2~3행: 문서번호·견적일
 * - 5~9행: 공급자 정보 테이블
 * - 11행: 품목 테이블 헤더
 * - 12행~: 품목 데이터 (금액 G열 = 수식 =E*F)
 * - 품목 아래 +2행: 공급가액 SUM(G...)
 * - +1행: 부가세 ROUND(공급가액*0.1,0)
 * - +1행: 총 합계 (공급가액+부가세)
 */

import ExcelJS from "exceljs";

import { formatKoreanDate } from "@/lib/document/buildDocumentMeta";
import { DEFAULT_SUPPLIER } from "@/lib/document/defaultSupplier";
import type { DocumentMeta, SupplierInfo } from "@/types/document";
import type { QuoteItem } from "@/types";

/** 열 번호 (1-based) — 유지보수 시 이 상수만 확인 */
const COL = {
  NO: 1, // A
  PRODUCT: 2, // B
  MODEL: 3, // C
  MANUFACTURER: 4, // D
  QTY: 5, // E — 수량 (수식 좌측)
  UNIT: 6, // F — 단가 (수식 우측)
  AMOUNT: 7, // G — 금액 (=E*F)
} as const;

const LAST_COL = COL.AMOUNT;

/** 행 번호 (1-based) */
const ROW = {
  TITLE: 1,
  DOC_NO: 2,
  DOC_DATE: 3,
  SUPPLIER_START: 5,
  HEADER: 11,
  ITEMS_START: 12,
} as const;

const NUM_FMT_KRW = "#,##0";
const FILL_TITLE = "FF27272A";
const FILL_LABEL = "FFF4F4F5";

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: "thin", color: { argb: "FFD4D4D8" } },
  left: { style: "thin", color: { argb: "FFD4D4D8" } },
  bottom: { style: "thin", color: { argb: "FFD4D4D8" } },
  right: { style: "thin", color: { argb: "FFD4D4D8" } },
};

function colLetter(col: number): string {
  return String.fromCharCode(64 + col);
}

function setAllBorders(cell: ExcelJS.Cell) {
  cell.border = thinBorder;
}

export interface BuildQuoteWorkbookParams {
  items: QuoteItem[];
  meta: DocumentMeta;
  supplier?: SupplierInfo;
}

/**
 * 견적 품목·메타로 ExcelJS Workbook을 생성합니다.
 */
export async function buildQuoteWorkbook(
  params: BuildQuoteWorkbookParams,
): Promise<ExcelJS.Workbook> {
  const { items, meta, supplier = DEFAULT_SUPPLIER } = params;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart Quote App";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("견적서", {
    views: [{ showGridLines: true }],
  });

  sheet.columns = [
    { width: 6 },
    { width: 28 },
    { width: 16 },
    { width: 14 },
    { width: 10 },
    { width: 14 },
    { width: 16 },
  ];

  // --- 1행: 견적서 타이틀 (A1:G1 병합) ---
  sheet.mergeCells(ROW.TITLE, 1, ROW.TITLE, LAST_COL);
  const titleCell = sheet.getCell(ROW.TITLE, 1);
  titleCell.value = "견 적 서";
  titleCell.font = { size: 20, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: FILL_TITLE },
  };
  sheet.getRow(ROW.TITLE).height = 36;

  // --- 2~3행: 문서번호·견적일 ---
  sheet.getCell(ROW.DOC_NO, 1).value = "문서번호";
  sheet.getCell(ROW.DOC_NO, 2).value = meta.documentNo;
  sheet.getCell(ROW.DOC_DATE, 1).value = "견적일";
  sheet.getCell(ROW.DOC_DATE, 2).value = formatKoreanDate(meta.issuedAt);

  // --- 5~9행: 공급자 정보 ---
  const supplierRows: [string, string][] = [
    ["상호", supplier.companyName],
    ["주소", supplier.address],
    ["대표", supplier.representative ?? "-"],
    ["연락처", supplier.phone],
    ["사업자번호", supplier.businessNumber ?? "-"],
  ];

  supplierRows.forEach(([label, value], index) => {
    const r = ROW.SUPPLIER_START + index;
    const labelCell = sheet.getCell(r, 1);
    const valueCell = sheet.getCell(r, 2);
    labelCell.value = label;
    valueCell.value = value;
    labelCell.font = { bold: true };
    labelCell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: FILL_LABEL },
    };
    setAllBorders(labelCell);
    setAllBorders(valueCell);
    sheet.mergeCells(r, 2, r, LAST_COL);
  });

  // --- 10행: 안내 문구 ---
  sheet.mergeCells(10, 1, 10, LAST_COL);
  const stmtCell = sheet.getCell(10, 1);
  stmtCell.value = "아래와 같이 견적합니다.";
  stmtCell.alignment = { horizontal: "center" };
  stmtCell.font = { bold: true, size: 12 };

  // --- 11행: 테이블 헤더 ---
  const headers = ["No", "품명", "모델명", "제조사", "수량", "단가", "금액"];
  headers.forEach((text, i) => {
    const cell = sheet.getCell(ROW.HEADER, i + 1);
    cell.value = text;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: FILL_TITLE },
    };
    cell.alignment = {
      horizontal: i >= COL.QTY - 1 ? "right" : "center",
      vertical: "middle",
    };
    if (i === 0 || i === COL.QTY - 1) {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
    setAllBorders(cell);
  });
  sheet.getRow(ROW.HEADER).height = 22;

  // --- 12행~: 품목 (금액 G열 = 수식 =E*F) ---
  const firstItemRow = ROW.ITEMS_START;
  const lastItemRow = firstItemRow + Math.max(items.length, 1) - 1;

  items.forEach((item, index) => {
    const r = firstItemRow + index;
    sheet.getCell(r, COL.NO).value = index + 1;
    sheet.getCell(r, COL.PRODUCT).value = item.productName;
    sheet.getCell(r, COL.MODEL).value = item.modelName || "-";
    sheet.getCell(r, COL.MANUFACTURER).value = item.manufacturer || "-";

    const qtyCell = sheet.getCell(r, COL.QTY);
    qtyCell.value = Math.max(1, Math.floor(item.quantity));
    qtyCell.alignment = { horizontal: "center" };

    const unitCell = sheet.getCell(r, COL.UNIT);
    unitCell.value = Math.round(item.unitPrice);
    unitCell.numFmt = NUM_FMT_KRW;
    unitCell.alignment = { horizontal: "right" };

    const amountCell = sheet.getCell(r, COL.AMOUNT);
    amountCell.value = {
      formula: `${colLetter(COL.QTY)}${r}*${colLetter(COL.UNIT)}${r}`,
    };
    amountCell.numFmt = NUM_FMT_KRW;
    amountCell.alignment = { horizontal: "right" };
    amountCell.font = { bold: true };

    for (let c = 1; c <= LAST_COL; c += 1) {
      setAllBorders(sheet.getCell(r, c));
    }
  });

  // --- 합계 블록 (품목 마지막 행 + 2부터) ---
  const supplyRow = lastItemRow + 2;
  const vatRow = supplyRow + 1;
  const totalRow = supplyRow + 2;

  const amountCol = colLetter(COL.AMOUNT);

  sheet.mergeCells(supplyRow, 1, supplyRow, COL.AMOUNT - 1);
  sheet.getCell(supplyRow, 1).value = "공급가액";
  sheet.getCell(supplyRow, COL.AMOUNT).value = {
    formula: `SUM(${amountCol}${firstItemRow}:${amountCol}${lastItemRow})`,
  };
  sheet.getCell(supplyRow, COL.AMOUNT).numFmt = NUM_FMT_KRW;

  sheet.mergeCells(vatRow, 1, vatRow, COL.AMOUNT - 1);
  sheet.getCell(vatRow, 1).value = "부가세 (10%)";
  sheet.getCell(vatRow, COL.AMOUNT).value = {
    formula: `ROUND(${amountCol}${supplyRow}*0.1,0)`,
  };
  sheet.getCell(vatRow, COL.AMOUNT).numFmt = NUM_FMT_KRW;

  sheet.mergeCells(totalRow, 1, totalRow, COL.AMOUNT - 1);
  sheet.getCell(totalRow, 1).value = "총 합계금액";
  sheet.getCell(totalRow, 1).font = { bold: true };
  sheet.getCell(totalRow, COL.AMOUNT).value = {
    formula: `${amountCol}${supplyRow}+${amountCol}${vatRow}`,
  };
  sheet.getCell(totalRow, COL.AMOUNT).numFmt = NUM_FMT_KRW;
  sheet.getCell(totalRow, COL.AMOUNT).font = { bold: true, size: 12 };

  [supplyRow, vatRow, totalRow].forEach((r) => {
    sheet.getCell(r, 1).alignment = { horizontal: "right" };
    sheet.getCell(r, COL.AMOUNT).alignment = { horizontal: "right" };
    for (let c = 1; c <= LAST_COL; c += 1) {
      setAllBorders(sheet.getCell(r, c));
    }
  });

  // --- 하단 각주 ---
  const footRow = totalRow + 2;
  sheet.mergeCells(footRow, 1, footRow, LAST_COL);
  sheet.getCell(footRow, 1).value =
    "※ 본 견적의 유효기간은 발행일로부터 30일입니다. ※ 상기 금액은 부가가치세 포함 금액입니다.";
  sheet.getCell(footRow, 1).font = { size: 9, color: { argb: "FF71717A" } };

  return workbook;
}
