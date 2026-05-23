/**
 * @file app/reset-password/page.tsx
 * @description 이메일 링크로 진입한 사용자의 새 비밀번호 설정 페이지
 *
 * [보안·토큰 흐름]
 * 1. forgot-password에서 발송된 메일 링크 클릭 → 이 페이지로 redirect + URL hash 토큰
 * 2. supabaseClient(detectSessionInUrl: true)가 hash를 recovery 세션으로 교환
 * 3. PASSWORD_RECOVERY 이벤트 또는 getSession()으로 세션 확인 후 updateUser({ password })
 * 4. 성공 시 세션이 유지되므로 router.push('/') 로 자동 로그인 상태 진입
 * 5. 세션 없이 직접 접근 시 폼 비활성 + /forgot-password 안내
 */

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSupabaseClient } from "@/lib/supabaseClient";

type RecoveryState = "loading" | "ready" | "invalid";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("loading");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const timer = window.setTimeout(() => setRecoveryState("invalid"), 0);
      return () => window.clearTimeout(timer);
    }

    const supabase = getSupabaseClient();

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setRecoveryState("ready");
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setRecoveryState("ready");
      }
    });

    void checkSession();

    const timer = window.setTimeout(() => {
      void checkSession().then(() => {
        setRecoveryState((prev) => (prev === "loading" ? "invalid" : prev));
      });
    }, 1500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (recoveryState !== "ready") {
      setError("유효하지 않거나 만료된 재설정 링크입니다.");
      return;
    }

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);
    try {
      const supabase = getSupabaseClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) throw updateError;

      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "비밀번호 변경에 실패했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormDisabled = recoveryState !== "ready";

  return (
    <div className="mx-auto max-w-md rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
      <h1 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        새 비밀번호 설정
      </h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        이메일로 받은 재설정 링크를 통해 접속하셨습니다. 새 비밀번호를
        입력해 주세요.
      </p>

      {recoveryState === "loading" ? (
        <p className="mb-4 text-sm text-zinc-500">재설정 링크 확인 중...</p>
      ) : null}

      {recoveryState === "invalid" ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <p>유효하지 않거나 만료된 링크입니다.</p>
          <Link
            href="/forgot-password"
            className="mt-2 inline-block font-medium underline"
          >
            비밀번호 찾기에서 다시 요청하기
          </Link>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={isFormDisabled}
        />
        <Input
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isFormDisabled}
        />

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          loadingLabel="변경 중..."
          disabled={isFormDisabled}
        >
          비밀번호 변경 완료
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
