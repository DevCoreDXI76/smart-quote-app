/**
 * @file lib/document/buildDocumentMeta.ts
 * @description 문서 발행일·문서번호 생성
 */

import type { DocumentMeta } from "@/types/document";

/**
 * YYYYMMDD 형식 날짜 문자열
 */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

/**
 * 한국어 날짜 표시 (예: 2026년 5월 20일)
 */
export function formatKoreanDate(date: Date): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * 문서 메타를 생성합니다.
 * @param sequence - 당일 순번 (기본 1)
 */
export function buildDocumentMeta(sequence = 1): DocumentMeta {
  const issuedAt = new Date();
  const dateKey = formatDateKey(issuedAt);
  const seq = String(sequence).padStart(3, "0");
  return {
    issuedAt,
    documentNo: `${dateKey}-${seq}`,
  };
}

/**
 * PDF 파일명 접두어용 날짜 (YYYYMMDD)
 */
export function formatFilenameDate(date: Date): string {
  return formatDateKey(date);
}
