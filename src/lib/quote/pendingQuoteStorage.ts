/**
 * @file lib/quote/pendingQuoteStorage.ts
 * @description 비로그인 저장 시 견적 draft를 sessionStorage에 임시 보관·복구
 *
 * 키: pending_quote_data
 * 흐름: DocumentSavePanel(백업) → 로그인 → QuoteEditor(복구·clear)
 */

import { z } from "zod";

import type { QuoteItem } from "@/types";

/** sessionStorage 키 (브라우저 탭 단위, 닫으면 삭제) */
export const PENDING_QUOTE_STORAGE_KEY = "pending_quote_data";

/** 임시 저장되는 견적 draft (품목 + 문서 메타) */
export interface PendingQuoteDraft {
  items: QuoteItem[];
  title: string;
  isPublic: boolean;
  loadedDocumentId: string | null;
  /** 백업 시각 (ISO 8601, 디버깅용) */
  savedAt: string;
}

const quoteItemSchema = z.object({
  id: z.string(),
  productName: z.string(),
  modelName: z.string().optional().default(""),
  manufacturer: z.string(),
  detailedSpec: z.string(),
  imageUrl: z.string(),
  imageUrls: z.array(z.string()),
  majorFeatures: z.array(z.string()),
  quantity: z.number(),
  unitPrice: z.number(),
});

const pendingQuoteDraftSchema = z.object({
  items: z.array(quoteItemSchema).min(1),
  title: z.string(),
  isPublic: z.boolean(),
  loadedDocumentId: z.string().nullable(),
  savedAt: z.string(),
});

function assertBrowser(): void {
  if (typeof window === "undefined") {
    throw new Error("sessionStorage는 브라우저 환경에서만 사용할 수 있습니다.");
  }
}

/**
 * sessionStorage에 pending 견적 draft를 저장합니다.
 */
export function savePendingQuoteDraft(
  draft: Omit<PendingQuoteDraft, "savedAt">,
): void {
  assertBrowser();
  const payload: PendingQuoteDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(PENDING_QUOTE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    throw new Error(
      "브라우저 임시 저장 공간이 부족합니다. 품목 수를 줄이거나 탭을 정리해 주세요.",
    );
  }
}

/**
 * sessionStorage에서 pending 견적 draft를 읽습니다. 없거나 손상 시 null.
 */
export function loadPendingQuoteDraft(): PendingQuoteDraft | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(PENDING_QUOTE_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = pendingQuoteDraftSchema.parse(JSON.parse(raw));
    return {
      ...parsed,
      items: parsed.items.map((item) => ({
        ...item,
        modelName: item.modelName ?? "",
      })),
    };
  } catch {
    sessionStorage.removeItem(PENDING_QUOTE_STORAGE_KEY);
    return null;
  }
}

/** pending 견적 draft 존재 여부 */
export function hasPendingQuoteDraft(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(PENDING_QUOTE_STORAGE_KEY) !== null;
}

/** pending 견적 draft를 삭제합니다. */
export function clearPendingQuoteDraft(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(PENDING_QUOTE_STORAGE_KEY);
}
