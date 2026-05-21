/**
 * @file lib/format/currency.ts
 * @description 금액 표시 포맷 유틸리티
 */

const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

/**
 * 원화 금액을 한국 로케일 형식으로 표시합니다.
 * @param amount - 원 단위 금액
 * @returns 예: "₩10,000" 또는 "10,000원" (로케일에 따름)
 */
export function formatKRW(amount: number): string {
  return krwFormatter.format(amount);
}
