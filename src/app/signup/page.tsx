/**
 * @file app/signup/page.tsx
 * @description 회원가입 페이지
 */

"use client";

import Link from "next/link";

import { AuthForm } from "@/components/auth/AuthForm";

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        회원가입
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        이메일과 비밀번호로 계정을 만듭니다.
      </p>
      <AuthForm mode="signup" />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
