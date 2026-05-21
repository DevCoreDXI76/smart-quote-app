/**
 * @file components/quote/PdfQuoteDocument.tsx
 * @description @react-pdf/renderer 견적서 PDF 문서 컴포넌트 (A4 고정 레이아웃)
 */

import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { DEFAULT_SUPPLIER } from "@/lib/document/defaultSupplier";
import { ensurePdfFontsRegistered } from "@/lib/pdf/fonts";
import { formatDateDisplay, formatKRWForPdf } from "@/lib/pdf/format";
import type { QuoteTotals } from "@/lib/calculations/quoteTotals";
import type { QuoteItem } from "@/types";
import type { SupplierInfo } from "@/types/document";

ensurePdfFontsRegistered();

export interface PdfQuoteDocumentProps {
  items: QuoteItem[];
  totals: QuoteTotals;
  supplier?: SupplierInfo;
  issuedAt: Date;
  documentNo: string;
}

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansKR",
    fontSize: 10,
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 28,
    color: "#18181b",
    backgroundColor: "#ffffff",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: "#27272a",
    paddingBottom: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    letterSpacing: 2,
  },
  meta: {
    fontSize: 9,
    color: "#52525b",
    textAlign: "right",
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#71717a",
    marginBottom: 6,
  },
  supplierTable: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    marginBottom: 12,
  },
  supplierRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  supplierCellTh: {
    width: 70,
    backgroundColor: "#f4f4f5",
    padding: 6,
    fontWeight: 700,
  },
  supplierCellTd: {
    flexGrow: 1,
    padding: 6,
  },
  statement: {
    textAlign: "center",
    fontSize: 11,
    fontWeight: 700,
    marginVertical: 10,
    color: "#27272a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#a1a1aa",
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#27272a",
    color: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#3f3f46",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  th: { padding: 6, fontWeight: 700 },
  td: { padding: 6 },
  colNo: { width: 28, textAlign: "center" },
  colName: { flexGrow: 1 },
  colMaker: { width: 70 },
  colQty: { width: 38, textAlign: "center" },
  colUnit: { width: 80, textAlign: "right" },
  colAmount: { width: 88, textAlign: "right", fontWeight: 700 },
  totalsBox: {
    width: 220,
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#a1a1aa",
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  totalsRowLast: {
    borderBottomWidth: 0,
    backgroundColor: "#f4f4f5",
  },
  foot: {
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
    fontSize: 9,
    color: "#71717a",
    lineHeight: 1.4,
  },
});

function SupplierRow({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}: {
  leftLabel: string;
  leftValue: string;
  rightLabel?: string;
  rightValue?: string;
}) {
  return (
    <View style={styles.supplierRow}>
      <Text style={styles.supplierCellTh}>{leftLabel}</Text>
      <Text style={styles.supplierCellTd}>{leftValue}</Text>
      <Text style={styles.supplierCellTh}>{rightLabel ?? ""}</Text>
      <Text style={styles.supplierCellTd}>{rightValue ?? ""}</Text>
    </View>
  );
}

export function PdfQuoteDocument({
  items,
  totals,
  supplier = DEFAULT_SUPPLIER,
  issuedAt,
  documentNo,
}: PdfQuoteDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>견 적 서</Text>
          <View>
            <Text style={styles.meta}>문서번호: {documentNo || "-"}</Text>
            <Text style={styles.meta}>견적일: {formatDateDisplay(issuedAt)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>공급자 정보</Text>
        <View style={styles.supplierTable}>
          <SupplierRow
            leftLabel="상호"
            leftValue={supplier.companyName}
            rightLabel="대표"
            rightValue={supplier.representative ?? "-"}
          />
          <View style={styles.supplierRow}>
            <Text style={styles.supplierCellTh}>주소</Text>
            <Text style={styles.supplierCellTd}>{supplier.address}</Text>
            <Text style={styles.supplierCellTh}></Text>
            <Text style={styles.supplierCellTd}></Text>
          </View>
          <SupplierRow
            leftLabel="연락처"
            leftValue={supplier.phone}
            rightLabel="사업자번호"
            rightValue={supplier.businessNumber ?? "-"}
          />
        </View>

        <Text style={styles.statement}>아래와 같이 견적합니다.</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.th, styles.colNo]}>No</Text>
            <Text style={[styles.th, styles.colName]}>품명</Text>
            <Text style={[styles.th, styles.colMaker]}>제조사</Text>
            <Text style={[styles.th, styles.colQty]}>수량</Text>
            <Text style={[styles.th, styles.colUnit]}>단가</Text>
            <Text style={[styles.th, styles.colAmount]}>금액</Text>
          </View>

          {items.map((item, index) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={[styles.td, styles.colNo]}>{index + 1}</Text>
              <Text style={[styles.td, styles.colName]}>{item.productName}</Text>
              <Text style={[styles.td, styles.colMaker]}>
                {item.manufacturer || "-"}
              </Text>
              <Text style={[styles.td, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.td, styles.colUnit]}>
                {formatKRWForPdf(item.unitPrice)}
              </Text>
              <Text style={[styles.td, styles.colAmount]}>
                {formatKRWForPdf(totals.lineTotals[index] ?? 0)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>공급가액</Text>
            <Text>{formatKRWForPdf(totals.supplyAmount)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>부가세 (10%)</Text>
            <Text>{formatKRWForPdf(totals.vatAmount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsRowLast]}>
            <Text style={{ fontWeight: 700 }}>총 합계금액</Text>
            <Text style={{ fontWeight: 700, fontSize: 12 }}>
              {formatKRWForPdf(totals.totalAmount)}
            </Text>
          </View>
        </View>

        <View style={styles.foot}>
          <Text>※ 본 견적의 유효기간은 발행일로부터 30일입니다.</Text>
          <Text>※ 상기 금액은 부가가치세 포함 금액입니다.</Text>
        </View>
      </Page>
    </Document>
  );
}

