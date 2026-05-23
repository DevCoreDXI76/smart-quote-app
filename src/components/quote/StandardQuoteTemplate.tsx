/**
 * @file components/quote/StandardQuoteTemplate.tsx
 * @description 표준 비즈니스 견적서 A4 템플릿 (PDF·인쇄용)
 */

import { formatKoreanDate } from "@/lib/document/buildDocumentMeta";
import { DEFAULT_SUPPLIER } from "@/lib/document/defaultSupplier";
import { formatKRW } from "@/lib/format/currency";
import type { QuoteTotals } from "@/lib/calculations/quoteTotals";
import type { SupplierInfo } from "@/types/document";
import type { QuoteItem } from "@/types";

export const QUOTE_DOCUMENT_ROOT_ID = "quote-document-root";

export interface StandardQuoteTemplateProps {
  items: QuoteItem[];
  totals: QuoteTotals;
  supplier?: SupplierInfo;
  issuedAt?: Date;
  documentNo?: string;
  rootId?: string;
}

/**
 * 표준 견적서 HTML 템플릿 (A4 비율)
 */
export function StandardQuoteTemplate({
  items,
  totals,
  supplier = DEFAULT_SUPPLIER,
  issuedAt = new Date(),
  documentNo = "",
  rootId = QUOTE_DOCUMENT_ROOT_ID,
}: StandardQuoteTemplateProps) {
  const { lineTotals, supplyAmount, vatAmount, totalAmount } = totals;

  return (
    <div
      id={rootId}
      className="sqDoc sqQuote"
    >
      <style>{`
        .sqDoc{box-sizing:border-box;width:210mm;min-height:297mm;padding:15mm;background:#fff;color:#18181b;font:12px/1.5 Arial,Helvetica,sans-serif;}
        .sqQuoteHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding-bottom:12px;border-bottom:2px solid #27272a;margin-bottom:16px;}
        .sqQuoteTitle{font-size:24px;font-weight:700;letter-spacing:0.3em;margin:0;}
        .sqMeta{font-size:11px;color:#52525b;text-align:right;}
        .sqSectionTitle{font-size:11px;font-weight:700;color:#71717a;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:.08em;}
        .sqTable{width:100%;border-collapse:collapse;border:1px solid #d4d4d8;font-size:11px;}
        .sqTable th,.sqTable td{border:1px solid #d4d4d8;padding:6px 8px;vertical-align:top;}
        .sqTable th{background:#f4f4f5;font-weight:700;text-align:left;}
        .sqCenter{text-align:center;}
        .sqRight{text-align:right;}
        .sqItems thead th{background:#27272a;color:#fff;border-color:#3f3f46;}
        .sqItems tbody td{border-color:#e4e4e7;}
        .sqStatement{margin:10px 0 12px 0;text-align:center;font-size:13px;font-weight:600;color:#27272a;}
        .sqTotals{margin-left:auto;width:72mm;border:1px solid #a1a1aa;font-size:11px;}
        .sqTotalsRow{display:flex;justify-content:space-between;border-bottom:1px solid #d4d4d8;padding:6px 10px;}
        .sqTotalsRow:last-child{border-bottom:none;background:#f4f4f5;padding:8px 10px;}
        .sqEm{font-weight:700;}
        .sqFoot{margin-top:24px;padding-top:10px;border-top:1px solid #e4e4e7;color:#71717a;font-size:11px;}
      `}</style>
      <header className="mb-6 border-b-2 border-zinc-800 pb-4">
        <div className="sqQuoteHeader">
          <h1 className="sqQuoteTitle">
            견 적 서
          </h1>
          <div className="sqMeta">
            <p>문서번호: {documentNo || "-"}</p>
            <p>견적일: {formatKoreanDate(issuedAt)}</p>
          </div>
        </div>
      </header>

      <section className="mb-6">
        <h2 className="sqSectionTitle">
          공급자 정보
        </h2>
        <table className="sqTable">
          <tbody>
            <tr className="border-b border-zinc-300">
              <th style={{ width: "24mm" }}>
                상호
              </th>
              <td>{supplier.companyName}</td>
              <th style={{ width: "24mm" }}>
                대표
              </th>
              <td>{supplier.representative ?? "-"}</td>
            </tr>
            <tr className="border-b border-zinc-300">
              <th>
                주소
              </th>
              <td colSpan={3}>
                {supplier.address}
              </td>
            </tr>
            <tr>
              <th>
                연락처
              </th>
              <td>{supplier.phone}</td>
              <th>
                사업자번호
              </th>
              <td>{supplier.businessNumber ?? "-"}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p className="sqStatement">
        아래와 같이 견적합니다.
      </p>

      <table className="sqTable sqItems">
        <thead>
          <tr>
            <th className="sqCenter" style={{ width: "10mm" }}>
              No
            </th>
            <th>
              품명
            </th>
            <th style={{ width: "22mm" }}>
              모델명
            </th>
            <th style={{ width: "20mm" }}>
              제조사
            </th>
            <th className="sqCenter" style={{ width: "14mm" }}>
              수량
            </th>
            <th className="sqRight" style={{ width: "24mm" }}>
              단가
            </th>
            <th className="sqRight" style={{ width: "28mm" }}>
              금액
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="sqCenter">
                {index + 1}
              </td>
              <td>{item.productName}</td>
              <td>{item.modelName || "-"}</td>
              <td>{item.manufacturer || "-"}</td>
              <td className="sqCenter">
                {item.quantity}
              </td>
              <td className="sqRight">
                {formatKRW(item.unitPrice)}
              </td>
              <td className="sqRight sqEm">
                {formatKRW(lineTotals[index] ?? 0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sqTotals">
        <div className="sqTotalsRow">
          <span style={{ color: "#52525b" }}>공급가액</span>
          <span className="sqEm">{formatKRW(supplyAmount)}</span>
        </div>
        <div className="sqTotalsRow">
          <span style={{ color: "#52525b" }}>부가세 (10%)</span>
          <span className="sqEm">{formatKRW(vatAmount)}</span>
        </div>
        <div className="sqTotalsRow">
          <span className="sqEm">총 합계금액</span>
          <span className="sqEm" style={{ fontSize: "14px" }}>
            {formatKRW(totalAmount)}
          </span>
        </div>
      </div>

      <footer className="sqFoot">
        <p>※ 본 견적의 유효기간은 발행일로부터 30일입니다.</p>
        <p>※ 상기 금액은 부가가치세 포함 금액입니다.</p>
      </footer>
    </div>
  );
}
