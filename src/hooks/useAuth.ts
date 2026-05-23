/**
 * @file hooks/useAuth.ts
 * @description 이메일/비밀번호 회원가입·로그인·로그아웃 및 세션 유지
 *
 * 비로그인 저장 UX:
 * - DocumentSavePanel → sessionStorage `pending_quote_data` 백업
 * - 로그인 후 QuoteEditor → draft 자동 복구·clear
 * - 상세: src/lib/quote/pendingQuoteStorage.ts
 */

"use client";

export { useAuthContext as useAuth } from "@/contexts/AuthProvider";
export type { AuthContextValue } from "@/contexts/AuthProvider";
