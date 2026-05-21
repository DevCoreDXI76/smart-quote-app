/**
 * @file hooks/useAiProductSelection.ts
 * @description AI 검색 결과에서 이미지·가격 선택 상태 관리 훅
 *
 * QuoteItemForm에서 useAiProductSearch(검색)와 함께 사용합니다.
 * 이미지는 최대 MAX_SELECTABLE_IMAGES장까지 선택 가능합니다.
 */

"use client";

import { useCallback, useState } from "react";

import { MAX_SELECTABLE_IMAGES } from "@/lib/ai/constants";
import type { AiProductSearchResult } from "@/types/aiSearch";

export interface UseAiProductSelectionResult {
  /** 사용자가 선택한 이미지 URL 목록 (최대 3) */
  selectedImageUrls: string[];
  /** 현재 단가 입력란에 반영된 AI 추천 가격 (선택 표시용) */
  selectedPriceAmount: number | null;
  /**
   * 이미지 선택/해제 토글
   * @returns 성공 시 true, 3개 초과 시 false (Toast 표시용)
   */
  toggleImage: (url: string) => boolean;
  /** 선택 이미지·가격 상태 초기화 */
  clearSelection: () => void;
  /** AI 검색 직후 첫 이미지 자동 선택 */
  syncFromSearchResult: (result: AiProductSearchResult) => void;
  /** Min/Max/Avg 등 가격 버튼 클릭 시 단가 후보 저장 */
  setSelectedPriceAmount: (amount: number | null) => void;
}

/**
 * AI 검색 결과에 대한 사용자 선택(이미지·가격) 상태를 관리합니다.
 */
export function useAiProductSelection(): UseAiProductSelectionResult {
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [selectedPriceAmount, setSelectedPriceAmount] = useState<number | null>(
    null,
  );

  const clearSelection = useCallback(() => {
    setSelectedImageUrls([]);
    setSelectedPriceAmount(null);
  }, []);

  const toggleImage = useCallback((url: string): boolean => {
    let success = true;

    setSelectedImageUrls((prev) => {
      if (prev.includes(url)) {
        return prev.filter((item) => item !== url);
      }
      if (prev.length >= MAX_SELECTABLE_IMAGES) {
        success = false;
        return prev;
      }
      return [...prev, url];
    });

    return success;
  }, []);

  const syncFromSearchResult = useCallback((result: AiProductSearchResult) => {
    const first = result.imageUrls[0] ?? result.imageUrl;
    setSelectedImageUrls(first ? [first] : []);
    setSelectedPriceAmount(null);
  }, []);

  return {
    selectedImageUrls,
    selectedPriceAmount,
    toggleImage,
    clearSelection,
    syncFromSearchResult,
    setSelectedPriceAmount,
  };
}
