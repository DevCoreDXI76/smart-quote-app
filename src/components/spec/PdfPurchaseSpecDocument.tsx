/**
 * @file components/spec/PdfPurchaseSpecDocument.tsx
 * @description @react-pdf/renderer 구매사양서 PDF 문서 컴포넌트 (A4 고정 레이아웃)
 */

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

import { ensurePdfFontsRegistered } from "@/lib/pdf/fonts";
import { formatDateDisplay } from "@/lib/pdf/format";
import type { QuoteItem } from "@/types";

ensurePdfFontsRegistered();

export interface PdfPurchaseSpecDocumentProps {
  items: QuoteItem[];
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
  header: {
    borderBottomWidth: 2,
    borderBottomColor: "#27272a",
    paddingBottom: 10,
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 2,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    fontSize: 9,
    color: "#52525b",
  },
  itemSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e4e4e7",
  },
  itemTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 10,
    color: "#27272a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e4e4e7",
  },
  th: {
    width: 82,
    padding: 8,
    backgroundColor: "#f4f4f5",
    fontWeight: 700,
  },
  td: {
    flexGrow: 1,
    padding: 8,
  },
  pre: {
    whiteSpace: "pre-wrap",
  },
  bulletList: {
    marginTop: 2,
    marginLeft: 10,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  bullet: {
    width: 10,
    color: "#27272a",
  },
  imagesTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#71717a",
    marginBottom: 6,
  },
  imageGrid: {
    flexDirection: "row",
    gap: 8,
  },
  imageBox: {
    width: 160,
    height: 160,
    borderWidth: 1,
    borderColor: "#e4e4e7",
    backgroundColor: "#fafafa",
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

function getItemImageUrls(item: QuoteItem): string[] {
  if (item.imageUrls.length > 0) return item.imageUrls.slice(0, 3);
  if (item.imageUrl.trim()) return [item.imageUrl.trim()];
  return [];
}

export function PdfPurchaseSpecDocument({
  items,
  issuedAt,
  documentNo,
}: PdfPurchaseSpecDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>구 매 사 양 서</Text>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>문서번호: {documentNo || "-"}</Text>
            <Text style={styles.meta}>작성일: {formatDateDisplay(issuedAt)}</Text>
          </View>
        </View>

        {items.map((item, idx) => {
          const images = getItemImageUrls(item);
          const sectionStyle = idx === 0 ? undefined : styles.itemSection;
          return (
            <View key={item.id} style={sectionStyle}>
              <Text style={styles.itemTitle}>
                {items.length > 1 ? `${idx + 1}. ` : ""}
                {item.productName}
              </Text>

              <View style={styles.table}>
                <View style={styles.row}>
                  <Text style={styles.th}>제품명</Text>
                  <Text style={styles.td}>{item.productName}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.th}>제조사</Text>
                  <Text style={styles.td}>{item.manufacturer || "-"}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.th}>상세 스펙</Text>
                  <Text style={[styles.td, styles.pre]}>
                    {item.detailedSpec || "-"}
                  </Text>
                </View>
                <View style={[styles.row, { borderBottomWidth: 0 }]}>
                  <Text style={styles.th}>주요 기능</Text>
                  <View style={styles.td}>
                    {item.majorFeatures.length > 0 ? (
                      <View style={styles.bulletList}>
                        {item.majorFeatures.map((feature) => (
                          <View style={styles.bulletItem} key={feature}>
                            <Text style={styles.bullet}>•</Text>
                            <Text>{feature}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text>-</Text>
                    )}
                  </View>
                </View>
              </View>

              {images.length > 0 ? (
                <View>
                  <Text style={styles.imagesTitle}>제품 이미지</Text>
                  <View style={styles.imageGrid}>
                    {images.map((url, imageIndex) => (
                      <View style={styles.imageBox} key={`${item.id}-${imageIndex}`}>
                        {/* eslint-disable-next-line jsx-a11y/alt-text */}
                        <Image src={url} />
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          );
        })}

        <View style={styles.foot}>
          <Text>※ 본 문서는 구매 검토용 기술 사양서입니다.</Text>
        </View>
      </Page>
    </Document>
  );
}

