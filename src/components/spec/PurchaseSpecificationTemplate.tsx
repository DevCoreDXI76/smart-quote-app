/**
 * @file components/spec/PurchaseSpecificationTemplate.tsx
 * @description 구매사양서(기술 사양서) A4 템플릿 — 품목별 스펙 표 + 이미지 그리드
 */

import { formatKoreanDate } from "@/lib/document/buildDocumentMeta";
import type { QuoteItem } from "@/types";

export const SPEC_DOCUMENT_ROOT_ID = "spec-document-root";

export interface PurchaseSpecificationTemplateProps {
  items: QuoteItem[];
  issuedAt?: Date;
  documentNo?: string;
  rootId?: string;
}

/**
 * 품목에서 PDF용 이미지 URL 목록 (최대 3장)
 */
function getItemImageUrls(item: QuoteItem): string[] {
  if (item.imageUrls.length > 0) {
    return item.imageUrls.slice(0, 3);
  }
  if (item.imageUrl.trim()) {
    return [item.imageUrl.trim()];
  }
  return [];
}

/**
 * 구매사양서 HTML 템플릿 (A4 비율)
 */
export function PurchaseSpecificationTemplate({
  items,
  issuedAt = new Date(),
  documentNo = "",
  rootId = SPEC_DOCUMENT_ROOT_ID,
}: PurchaseSpecificationTemplateProps) {
  return (
    <div
      id={rootId}
      className="sqDoc sqSpec"
    >
      <style>{`
        .sqDoc{box-sizing:border-box;width:210mm;min-height:297mm;padding:15mm;background:#fff;color:#18181b;font:12px/1.5 Arial,Helvetica,sans-serif;}
        .sqSpecHeader{padding-bottom:12px;border-bottom:2px solid #27272a;margin-bottom:18px;}
        .sqSpecTitle{font-size:20px;font-weight:700;letter-spacing:0.2em;margin:0;}
        .sqSpecMeta{margin-top:6px;display:flex;justify-content:space-between;font-size:11px;color:#52525b;}
        .sqItemTitle{margin:0 0 10px 0;font-size:13px;font-weight:700;color:#27272a;}
        .sqTable{width:100%;border-collapse:collapse;border:1px solid #d4d4d8;font-size:11px;}
        .sqTable th,.sqTable td{border:1px solid #d4d4d8;padding:8px 10px;vertical-align:top;}
        .sqTable th{background:#f4f4f5;font-weight:700;text-align:left;width:28mm;}
        .sqPre{white-space:pre-wrap;}
        .sqList{margin:0;padding-left:18px;}
        .sqImagesTitle{margin:0 0 6px 0;font-size:11px;font-weight:700;color:#71717a;text-transform:uppercase;letter-spacing:.08em;}
        .sqImageGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
        .sqImgBox{aspect-ratio:1/1;overflow:hidden;border:1px solid #e4e4e7;background:#fafafa;border-radius:6px;}
        .sqImgBox img{width:100%;height:100%;object-fit:cover;display:block;}
        .sqSpecFoot{margin-top:24px;padding-top:10px;border-top:1px solid #e4e4e7;color:#71717a;font-size:11px;}
      `}</style>
      <header>
        <div className="sqSpecHeader">
        <h1 className="sqSpecTitle">
          구 매 사 양 서
        </h1>
        <div className="sqSpecMeta">
          <span>문서번호: {documentNo || "-"}</span>
          <span>작성일: {formatKoreanDate(issuedAt)}</span>
        </div>
        </div>
      </header>

      {items.map((item, itemIndex) => {
        const images = getItemImageUrls(item);
        return (
          <section
            key={item.id}
            style={
              itemIndex > 0
                ? { marginTop: "24px", paddingTop: "18px", borderTop: "1px solid #e4e4e7" }
                : undefined
            }
          >
            <h2 className="sqItemTitle">
              {items.length > 1 ? `${itemIndex + 1}. ` : ""}
              {item.productName}
            </h2>

            <table className="sqTable" style={{ marginBottom: "14px" }}>
              <tbody>
                <tr>
                  <th>
                    제품명
                  </th>
                  <td>{item.productName}</td>
                </tr>
                <tr>
                  <th>
                    제조사
                  </th>
                  <td>{item.manufacturer || "-"}</td>
                </tr>
                <tr>
                  <th>
                    상세 스펙
                  </th>
                  <td className="sqPre">
                    {item.detailedSpec || "-"}
                  </td>
                </tr>
                <tr>
                  <th>
                    주요 기능
                  </th>
                  <td>
                    {item.majorFeatures.length > 0 ? (
                      <ul className="sqList">
                        {item.majorFeatures.map((feature) => (
                          <li key={feature}>{feature}</li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              </tbody>
            </table>

            {images.length > 0 ? (
              <div>
                <h3 className="sqImagesTitle">
                  제품 이미지
                </h3>
                <div className="sqImageGrid">
                  {images.map((url, imgIndex) => (
                    <div
                      key={`${item.id}-img-${imgIndex}`}
                      className="sqImgBox"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`${item.productName} 이미지 ${imgIndex + 1}`}
                        crossOrigin="anonymous"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        );
      })}

      <footer className="sqSpecFoot">
        <p>※ 본 문서는 구매 검토용 기술 사양서입니다.</p>
      </footer>
    </div>
  );
}
