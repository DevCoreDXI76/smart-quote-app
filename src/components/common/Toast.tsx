/**
 * @file components/common/Toast.tsx
 * @description 화면 하단 고정 알림 (이미지 3개 초과 등)
 */

"use client";

import { useEffect } from "react";

export type ToastVariant = "info" | "warning" | "error";

export interface ToastProps {
  message: string;
  variant?: ToastVariant;
  /** 표시 후 자동 닫힘 (ms), 0이면 수동만 */
  durationMs?: number;
  onClose: () => void;
}

const variantClasses: Record<ToastVariant, string> = {
  info: "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
  warning: "bg-amber-600 text-white",
  error: "bg-red-600 text-white",
};

/**
 * 하단 고정 Toast 알림
 */
export function Toast({
  message,
  variant = "warning",
  durationMs = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    if (durationMs <= 0) return;
    const timer = setTimeout(onClose, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, onClose]);

  return (
    <div
      role="alert"
      className={`fixed bottom-6 left-1/2 z-50 max-w-sm -translate-x-1/2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${variantClasses[variant]}`}
    >
      {message}
    </div>
  );
}
