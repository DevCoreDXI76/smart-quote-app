/**
 * @file components/common/Modal.tsx
 * @description 공통 모달 다이얼로그 (문서 미리보기 등)
 */

"use client";

import { type ReactNode, useEffect, useId } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * 접근성 기본을 갖춘 모달
 */
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="모달 닫기"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-zinc-900"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2
            id={titleId}
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="닫기"
          >
            ✕
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-auto bg-zinc-100 p-4 dark:bg-zinc-950">
          {children}
        </div>
        {footer ? (
          <footer className="flex shrink-0 justify-end gap-2 border-t border-zinc-200 px-6 py-4 dark:border-zinc-700">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}
