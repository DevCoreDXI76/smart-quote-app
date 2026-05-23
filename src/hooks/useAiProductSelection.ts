/**
 * @file hooks/useAiProductSelection.ts
 * @description AI 검색 결과에서 후보·이미지·가격 선택 상태 관리 훅
 *
 * QuoteItemForm에서 useAiProductSearch(검색)와 함께 사용합니다.
 */

"use client";

import { useCallback, useMemo, useState } from "react";

import { MAX_SELECTABLE_IMAGES } from "@/lib/ai/constants";
import type { AiProductCandidate, AiProductSearchResult } from "@/types/aiSearch";

export interface UseAiProductSelectionResult {
  /** 선택된 후보 ID */
  selectedCandidateId: string | null;
  /** 현재 선택된 후보 (검색 결과에서 조회) */
  selectedCandidate: AiProductCandidate | null;
  /** 사용자가 선택한 이미지 URL 목록 (최대 3) */
  selectedImageUrls: string[];
  /** 현재 단가 입력란에 반영된 AI 추천 가격 */
  selectedPriceAmount: number | null;
  /** 후보 카드 선택 */
  selectCandidate: (candidate: AiProductCandidate) => void;
  /** 이미지 선택/해제 토글 */
  toggleImage: (url: string) => boolean;
  /** 선택 상태 초기화 */
  clearSelection: () => void;
  /** AI 검색 직후 첫 후보 자동 선택 */
  syncFromSearchResult: (result: AiProductSearchResult) => AiProductCandidate | null;
  /** Min/Max/Avg 등 가격 버튼 클릭 시 단가 후보 저장 */
  setSelectedPriceAmount: (amount: number | null) => void;
}

/**
 * AI 검색 결과에 대한 사용자 선택(후보·이미지·가격) 상태를 관리합니다.
 */
export function useAiProductSelection(): UseAiProductSelectionResult {
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    null,
  );
  const [candidates, setCandidates] = useState<AiProductCandidate[]>([]);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  const [selectedPriceAmount, setSelectedPriceAmount] = useState<number | null>(
    null,
  );

  const selectedCandidate = useMemo(
    () =>
      candidates.find((c) => c.candidateId === selectedCandidateId) ?? null,
    [candidates, selectedCandidateId],
  );

  const clearSelection = useCallback(() => {
    setSelectedCandidateId(null);
    setCandidates([]);
    setSelectedImageUrls([]);
    setSelectedPriceAmount(null);
  }, []);

  const selectCandidate = useCallback((candidate: AiProductCandidate) => {
    setSelectedCandidateId(candidate.candidateId);
    const first = candidate.imageUrls[0] ?? candidate.imageUrl;
    setSelectedImageUrls(first ? [first] : []);
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

  const syncFromSearchResult = useCallback(
    (result: AiProductSearchResult): AiProductCandidate | null => {
      const list = result.candidates ?? [];
      setCandidates(list);
      const first = list[0] ?? null;
      if (first) {
        setSelectedCandidateId(first.candidateId);
        const img = first.imageUrls[0] ?? first.imageUrl;
        setSelectedImageUrls(img ? [img] : []);
      } else {
        setSelectedCandidateId(null);
        setSelectedImageUrls([]);
      }
      setSelectedPriceAmount(null);
      return first;
    },
    [],
  );

  return {
    selectedCandidateId,
    selectedCandidate,
    selectedImageUrls,
    selectedPriceAmount,
    selectCandidate,
    toggleImage,
    clearSelection,
    syncFromSearchResult,
    setSelectedPriceAmount,
  };
}
