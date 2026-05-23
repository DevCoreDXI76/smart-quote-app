/**
 * @file hooks/useAuth.ts
 * @description 이메일/비밀번호 회원가입·로그인·로그아웃 및 세션·프로필(role) 유지
 *
 * 반환값:
 * - isAdmin: profile.role === "admin" (UI·클라이언트 가드용)
 * - profile: public.users 프로필 (role 포함)
 *
 * 비로그인 견적 draft:
 * - DocumentSavePanel → sessionStorage `pending_quote_data` 백업
 * - 로그인 후 QuoteEditor → draft 자동 복구·clear
 * - 상세: src/lib/quote/pendingQuoteStorage.ts
 *
 * [보안] isAdmin만으로 권한을 신뢰하지 마세요. /admin은 middleware, /api/admin/* 는
 * verifyAdminRequest + DB RLS가 최종 검증합니다.
 */

"use client";

export { useAuthContext as useAuth } from "@/contexts/AuthProvider";
export type { AuthContextValue } from "@/contexts/AuthProvider";
