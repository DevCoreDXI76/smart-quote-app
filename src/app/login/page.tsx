/**
 * @file app/login/page.tsx
 * @description 이메일/비밀번호 로그인 페이지
 */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthForm } from "@/components/auth/AuthForm";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";

  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        로그인
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        Smart Quote에 로그인하여 견적서를 저장하고 관리하세요.
      </p>
      <AuthForm mode="login" onSuccess={() => router.push(redirect)} />
      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-medium underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="text-center text-sm text-zinc-500">로딩 중...</p>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
