/**
 * @file types/index.ts
 * @description Smart Quote App 전역 TypeScript 타입 정의
 *
 * 이 파일은 견적서·구매사양서 도메인에서 공통으로 사용하는
 * 데이터 구조(품목, 문서 마스터)를 한곳에서 export 합니다.
 * UI·훅·라이브러리 레이어는 이 타입만 참조하여 결합도를 낮춥니다.
 */

export type {
  AiPriceSource,
  AiPriceTrend,
  AiProductCandidate,
  AiProductSearchErrorResponse,
  AiProductSearchRequest,
  AiProductSearchResult,
} from "./aiSearch";

/**
 * 견적·구매사양서 품목 1행
 */
export interface QuoteItem {
  /** 품목 고유 ID */
  id: string;
  /** 제품명 (세부 옵션 포함 가능) */
  productName: string;
  /** 제조사 공식 모델명/모델코드 (예: A3090) */
  modelName: string;
  /** 제조사 */
  manufacturer: string;
  /** 상세 스펙 (AI 검색 결과 또는 수동 입력) */
  detailedSpec: string;
  /** 대표 이미지 URL (imageUrls[0] 또는 수동 입력) */
  imageUrl: string;
  /** 선택된 제품 이미지 URL (최대 3개) */
  imageUrls: string[];
  /** AI가 찾은 주요 기능 목록 */
  majorFeatures: string[];
  /** 수량 (양의 정수 권장) */
  quantity: number;
  /** 단가 (원, 정수 권장) */
  unitPrice: number;
}

/**
 * 문서 마스터 (견적서 / 구매사양서 공통)
 */
export interface DocumentMaster {
  /** 문서 고유 ID */
  id: string;
  /** 작성자(소유자) 사용자 ID — Supabase Auth 연동 예정 */
  userId: string;
  /** 문서 제목 */
  title: string;
  /** 공개 여부 */
  isPublic: boolean;
  /** 생성 일시 (ISO 8601, Supabase timestamptz와 호환) */
  createdAt: string;
  /** 포함 품목 목록 */
  items: QuoteItem[];
}

/** @deprecated AiProductCandidate 사용 권장 — 하위 호환 alias */
export type ProductCandidate = import("./aiSearch").AiProductCandidate;
