/**
 * @file hooks/useQuoteItems.ts
 * @description 견적 품목 목록 상태 및 CRUD 커스텀 훅
 */

"use client";

import { useCallback, useState } from "react";

import type { QuoteItem } from "@/types";

export interface UseQuoteItemsResult {
  /** 현재 품목 목록 */
  items: QuoteItem[];
  /** 품목 추가 */
  addItem: (item: QuoteItem) => void;
  /** id로 품목 삭제 */
  removeItem: (id: string) => void;
  /** id로 품목 필드 갱신 (추후 수정 UI용) */
  updateItem: (id: string, patch: Partial<Omit<QuoteItem, "id">>) => void;
  /** 목록 전체 교체 */
  setItems: (items: QuoteItem[]) => void;
}

/**
 * 견적 품목 배열의 추가·삭제·수정 상태를 관리합니다.
 */
export function useQuoteItems(initialItems: QuoteItem[] = []): UseQuoteItemsResult {
  const [items, setItems] = useState<QuoteItem[]>(initialItems);

  const addItem = useCallback((item: QuoteItem) => {
    setItems((prev) => [...prev, item]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateItem = useCallback(
    (id: string, patch: Partial<Omit<QuoteItem, "id">>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  return {
    items,
    addItem,
    removeItem,
    updateItem,
    setItems,
  };
}
