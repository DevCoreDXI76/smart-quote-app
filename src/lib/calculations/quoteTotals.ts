/**
 * @file lib/calculations/quoteTotals.ts
 * @description 견적서 금액 계산 순수 함수 모듈
 *
 * UI·React 훅과 분리된 비즈니스 로직입니다.
 * 원 단위 정수 연산과 Math.round로 부동소수점 오차를 방지합니다.
 */

import type { QuoteItem } from "@/types";

/** 견적 금액 계산 결과 */
export interface QuoteTotals {
  /** 공급가액 (품목별 금액 합계, 부가세 제외) */
  supplyAmount: number;
  /** 부가세 (공급가액의 10%, 원 단위 반올림) */
  vatAmount: number;
  /** 총 합계금액 (공급가액 + 부가세) */
  totalAmount: number;
  /** 품목별 금액 (UI 행 표시용, items와 동일 순서) */
  lineTotals: number[];
}

/** 한국 부가가치세율 (10%) */
const VAT_RATE = 0.1;

/**
 * 단일 품목의 공급가액(행 금액)을 계산합니다.
 * @param item - 견적 품목
 * @returns 원 단위 정수 금액
 */
function calculateLineTotal(item: QuoteItem): number {
  const quantity = Math.max(0, Math.floor(item.quantity));
  const unitPrice = Math.round(item.unitPrice);
  return Math.round(unitPrice * quantity);
}

/**
 * 품목 리스트로부터 공급가액, 부가세, 총 합계를 계산합니다.
 * @param items - 견적 품목 배열
 * @returns QuoteTotals
 */
export function calculateQuoteTotals(items: QuoteItem[]): QuoteTotals {
  const lineTotals = items.map(calculateLineTotal);
  const supplyAmount = lineTotals.reduce((sum, amount) => sum + amount, 0);
  const vatAmount = Math.round(supplyAmount * VAT_RATE);
  const totalAmount = supplyAmount + vatAmount;

  return {
    supplyAmount,
    vatAmount,
    totalAmount,
    lineTotals,
  };
}
