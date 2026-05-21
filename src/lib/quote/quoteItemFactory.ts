/**
 * @file lib/quote/quoteItemFactory.ts
 * @description 견적 품목 객체 생성 팩토리
 */

import type { QuoteItem } from "@/types";

/**
 * 빈 견적 품목 객체를 생성합니다 (폼 초기값·추가 시 사용).
 */
export function createEmptyQuoteItem(): QuoteItem {
  return {
    id: crypto.randomUUID(),
    productName: "",
    manufacturer: "",
    detailedSpec: "",
    imageUrl: "",
    imageUrls: [],
    majorFeatures: [],
    quantity: 1,
    unitPrice: 0,
  };
}
