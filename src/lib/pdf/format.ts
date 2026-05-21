/**
 * @file lib/pdf/format.ts
 * @description PDF 출력 전용 포맷 유틸
 */

/** 원화 표시 (₩10,000) */
export function formatKRWForPdf(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(safe);
}

/** 파일명용 날짜 (YYYYMMDD) */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/** 표시용 날짜 (YYYY.MM.DD) */
export function formatDateDisplay(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

