/**
 * @file lib/supabase/mapDocument.ts
 * @description DB 행 ↔ 앱 도메인 타입(QuoteItem, DocumentMaster) 변환
 */

import type { DocumentMaster, QuoteItem } from "@/types";
import {
  decodeModelNameFromImageUrls,
  encodeModelNameInImageUrls,
  isModelNameMetaUrl,
} from "@/lib/quote/modelNameMeta";

/** Supabase documents 테이블 행 */
export interface DbDocumentRow {
  id: string;
  user_id: string;
  title: string;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
}

/** Supabase products 테이블 행 */
export interface DbProductRow {
  id: string;
  document_id: string;
  product_name: string;
  /** model_name 컬럼 마이그레이션 전 DB에서는 없을 수 있음 */
  model_name?: string;
  manufacturer: string;
  detailed_spec: string;
  image_url: string;
  image_urls: string[] | null;
  major_features: string[] | null;
  quantity: number;
  unit_price: number;
  sort_order: number;
}

/** products 조회 — model_name 포함 (신규 스키마) */
export const PRODUCT_SELECT_FULL =
  "id, document_id, product_name, model_name, manufacturer, detailed_spec, image_url, image_urls, major_features, quantity, unit_price, sort_order";

/** products 조회 — model_name 제외 (구 스키마 호환) */
export const PRODUCT_SELECT_LEGACY =
  "id, document_id, product_name, manufacturer, detailed_spec, image_url, image_urls, major_features, quantity, unit_price, sort_order";

/** model_name 컬럼 미적용 DB 오류 여부 */
export function isMissingModelNameColumnError(error: {
  message?: string;
}): boolean {
  return /model_name/.test(error.message ?? "");
}

/** RPC save_document_with_products 에 전달할 품목 JSON */
export interface DbProductInsertPayload {
  product_name: string;
  model_name: string;
  manufacturer: string;
  detailed_spec: string;
  image_url: string;
  image_urls: string[];
  major_features: string[];
  quantity: number;
  unit_price: number;
  sort_order: number;
}

/**
 * QuoteItem 배열을 DB 저장용 JSON 배열로 변환합니다.
 */
export function quoteItemsToDbPayload(
  items: QuoteItem[],
): DbProductInsertPayload[] {
  return items.map((item, index) => {
    const imageUrls = encodeModelNameInImageUrls(
      item.modelName,
      item.imageUrls ?? [],
    );
    const displayUrls = imageUrls.filter((u) => !isModelNameMetaUrl(u));

    return {
      product_name: item.productName,
      model_name: item.modelName.trim(),
      manufacturer: item.manufacturer,
      detailed_spec: item.detailedSpec,
      image_url: (item.imageUrl || displayUrls[0] || "").trim(),
      image_urls: imageUrls,
      major_features: item.majorFeatures ?? [],
      quantity: item.quantity,
      unit_price: Math.round(item.unitPrice),
      sort_order: index,
    };
  });
}

/**
 * products 행을 QuoteItem으로 변환합니다.
 */
export function dbProductToQuoteItem(row: DbProductRow): QuoteItem {
  const rawUrls = Array.isArray(row.image_urls) ? row.image_urls : [];
  const { modelName: modelFromMeta, imageUrls } =
    decodeModelNameFromImageUrls(rawUrls);
  const majorFeatures = Array.isArray(row.major_features)
    ? row.major_features
    : [];

  const modelName = (row.model_name?.trim() || modelFromMeta).trim();

  return {
    id: row.id,
    productName: row.product_name,
    modelName,
    manufacturer: row.manufacturer,
    detailedSpec: row.detailed_spec,
    imageUrl: row.image_url || imageUrls[0] || "",
    imageUrls,
    majorFeatures,
    quantity: row.quantity,
    unitPrice: Number(row.unit_price),
  };
}

/**
 * documents + products 를 DocumentMaster로 조합합니다.
 */
export function rowsToDocumentMaster(
  doc: DbDocumentRow,
  products: DbProductRow[],
): DocumentMaster {
  const sorted = [...products].sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: doc.id,
    userId: doc.user_id,
    title: doc.title,
    isPublic: doc.is_public,
    createdAt: doc.created_at,
    items: sorted.map(dbProductToQuoteItem),
  };
}

/** 목록·게시판용 요약 */
export interface DocumentListItem {
  id: string;
  userId: string;
  title: string;
  isPublic: boolean;
  createdAt: string;
  itemCount: number;
  authorLabel?: string;
}

/**
 * 공개 게시판 목록용 작성자 표시 문자열
 */
export function formatAuthorLabel(
  email?: string | null,
  displayName?: string | null,
): string {
  if (displayName?.trim()) return displayName.trim();
  if (!email) return "익명";
  const [local] = email.split("@");
  if (local.length <= 2) return `${local[0]}***`;
  return `${local.slice(0, 2)}***`;
}
