/**
 * @file types/index.ts
 * @description Smart Quote App 전역 TypeScript 타입 정의
 *
 * [보안 가이드 — UserRole / AppUserProfile]
 * - role 값은 Supabase public.users.role 컬럼과 1:1 동기화됩니다.
 * - 프론트엔드에서 role을 직접 UPDATE하지 마세요. admin_set_user_role RPC 또는
 *   서버 API Route(/api/admin/*)만 사용합니다.
 * - isAdmin 판별은 UI·미들웨어 보조용이며, 실제 권한은 DB RLS·RPC가 강제합니다.
 */

export type {
  AiPriceSource,
  AiPriceTrend,
  AiProductCandidate,
  AiProductSearchErrorResponse,
  AiProductSearchRequest,
  AiProductSearchResult,
} from "./aiSearch";

/** Supabase public.users.role — DB check 제약과 동일 */
export type UserRole = "user" | "admin";

/**
 * 앱 프로필 (auth.users + public.users)
 * role 변경은 admin RPC / 서버 API만 허용
 */
export interface AppUserProfile {
  id: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
}

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
