/**
 * @file app/forgot-password/page.tsx
 * @description 비밀번호 재설정 이메일 요청 페이지
 *
 * [보안·토큰 흐름]
 * 1. resetPasswordForEmail() → Supabase가 재설정 메일 발송
 * 2. redirectTo는 반드시 절대 URL (origin + '/reset-password')
 * 3. Supabase Dashboard → Authentication → URL Configuration 에
 *    http://localhost:3000/reset-password 및 배포 URL을 Redirect URLs에 등록해야 함
 * 4. 성공 메시지는 계정 존재 여부를 노출하지 않는 통합 문구 사용
 */

"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!isSupabaseConfigured()) {
      setError("Supabase 환경 변수가 설정되지 않았습니다.");
      return;
    }

    const trimmed = email.trim();
    if (!trimmed) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        },
      );

      if (resetError) throw resetError;

      setSuccessMessage(
        "입력하신 이메일로 재설정 링크를 보냈습니다. 메일함을 확인해 주세요.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "재설정 링크 발송에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        비밀번호 찾기
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        가입 시 사용한 이메일을 입력하면 비밀번호 재설정 링크를 보내 드립니다.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="이메일"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={Boolean(successMessage)}
        />

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
        {successMessage ? (
          <p className="text-sm text-green-700 dark:text-green-400" role="status">
            {successMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingLabel="발송 중..."
          disabled={Boolean(successMessage)}
        >
          재설정 링크 보내기
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <Link href="/login" className="font-medium underline">
          ← 로그인
        </Link>
      </p>
    </div>
  );
}
