/**
 * @file hooks/useAuth.ts
 * @description 이메일/비밀번호 회원가입·로그인·로그아웃 및 세션 유지
 */

"use client";

export { useAuthContext as useAuth } from "@/contexts/AuthProvider";
export type { AuthContextValue } from "@/contexts/AuthProvider";
