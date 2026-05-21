/**
 * @file hooks/useQuoteCalculations.ts
 * @description 견적 품목 리스트 기반 실시간 금액 계산 커스텀 훅
 *
 * 품목 배열이 변경될 때만 useMemo로 재계산하여
 * UI 리렌더 시 불필요한 연산을 줄입니다.
 * 실제 계산 로직은 lib/calculations/quoteTotals에 위임합니다.
 */

"use client";

import { useMemo } from "react";

import {
  calculateQuoteTotals,
  type QuoteTotals,
} from "@/lib/calculations/quoteTotals";
import type { QuoteItem } from "@/types";

export type { QuoteTotals };

/**
 * 견적 품목 리스트의 공급가액·부가세·총 합계를 실시간 계산합니다.
 * @param items - 견적 품목 배열
 * @returns QuoteTotals (supplyAmount, vatAmount, totalAmount, lineTotals)
 */
export function useQuoteCalculations(items: QuoteItem[]): QuoteTotals {
  return useMemo(() => calculateQuoteTotals(items), [items]);
}
