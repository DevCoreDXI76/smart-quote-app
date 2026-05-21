/**
 * @file hooks/useAiProductSearch.ts
 * @description AI 제품 정보 검색 커스텀 훅
 *
 * 컴포넌트에서 API를 직접 호출하지 않고 이 훅을 사용합니다.
 * 흐름: QuoteItemForm → useAiProductSearch → fetchProductSearch → /api/ai-search
 */

"use client";

import { useCallback, useState } from "react";

import { fetchProductSearch } from "@/lib/ai/fetchProductSearch";
import type { AiProductSearchResult } from "@/types/aiSearch";

export interface UseAiProductSearchResult {
  /** 검색 진행 중 여부 */
  isLoading: boolean;
  /** 사용자에게 표시할 오류 메시지 */
  error: string | null;
  /** 마지막 검색 성공 결과 */
  result: AiProductSearchResult | null;
  /** 제품명으로 AI 검색 실행 */
  search: (productName: string) => Promise<AiProductSearchResult | null>;
  /** 결과·오류 초기화 */
  reset: () => void;
}

/**
 * AI 제품 검색 상태 및 search/reset 함수를 제공합니다.
 */
export function useAiProductSearch(): UseAiProductSearchResult {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiProductSearchResult | null>(null);

  const reset = useCallback(() => {
    setError(null);
    setResult(null);
    setIsLoading(false);
  }, []);

  const search = useCallback(async (productName: string) => {
    const trimmed = productName.trim();

    if (!trimmed) {
      setError("제품명을 입력한 뒤 AI 검색을 실행해 주세요.");
      setResult(null);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchProductSearch(trimmed);
      setResult(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "AI 검색 중 오류가 발생했습니다.";
      setError(message);
      setResult(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    result,
    search,
    reset,
  };
}
