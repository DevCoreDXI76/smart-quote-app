/**
 * @file components/common/Input.tsx
 * @description 라벨·에러 메시지를 포함한 공통 입력 필드
 */

import type { InputHTMLAttributes } from "react";

import { Label } from "./Label";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** 필드 라벨 */
  label: string;
  /** 유효성 검사 에러 메시지 */
  error?: string;
  /** input id (미지정 시 label에서 자동 생성) */
  id?: string;
  /** AI 검색 등 로딩 중 pulse 애니메이션 */
  isLoading?: boolean;
}

/**
 * 라벨이 붙은 텍스트/숫자/URL 입력 필드
 */
export function Input({
  label,
  error,
  id,
  className = "",
  readOnly,
  disabled,
  isLoading = false,
  ...props
}: InputProps) {
  const inputId = id ?? props.name ?? label.replace(/\s/g, "-");
  const isLocked = readOnly || disabled;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <input
          id={inputId}
          readOnly={readOnly}
          disabled={disabled}
          className={`h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-400 dark:focus:ring-zinc-700 ${
            isLocked
              ? "cursor-not-allowed bg-zinc-50 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-400"
              : ""
          } ${isLoading ? "animate-pulse" : ""} ${error ? "border-red-500 dark:border-red-500" : ""} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          aria-busy={isLoading}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
