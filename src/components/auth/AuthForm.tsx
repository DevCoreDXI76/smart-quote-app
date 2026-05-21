/**
 * @file components/auth/AuthForm.tsx
 * @description 로그인·회원가입 공통 폼
 */

"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useAuth } from "@/hooks/useAuth";

export type AuthFormMode = "login" | "signup";

export interface AuthFormProps {
  mode: AuthFormMode;
  onSuccess?: () => void;
}

/**
 * 이메일/비밀번호 인증 폼
 */
export function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const { signIn, signUp, isConfigured } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isConfigured) {
      setError("Supabase 환경 변수가 설정되지 않았습니다.");
      return;
    }

    if (!email.trim() || password.length < 6) {
      setError("이메일과 비밀번호(6자 이상)를 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await signUp(email.trim(), password);
        setSignupDone(true);
      } else {
        await signIn(email.trim(), password);
        onSuccess?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "인증에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (signupDone) {
    return (
      <p className="text-sm text-green-700 dark:text-green-400">
        회원가입 요청이 완료되었습니다. 이메일 확인이 필요한 경우 메일함을 확인한 뒤
        로그인해 주세요.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="이메일"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="비밀번호"
        type="password"
        autoComplete={mode === "signup" ? "new-password" : "current-password"}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
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
        loadingLabel={mode === "signup" ? "가입 중..." : "로그인 중..."}
      >
        {mode === "signup" ? "회원가입" : "로그인"}
      </Button>
    </form>
  );
}
