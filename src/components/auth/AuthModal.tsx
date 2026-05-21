/**
 * @file components/auth/AuthModal.tsx
 * @description 미로그인 시 저장 등에서 띄우는 로그인/회원가입 모달
 */

"use client";

import Link from "next/link";
import { useState } from "react";

import { Modal } from "@/components/common/Modal";
import { AuthForm, type AuthFormMode } from "./AuthForm";

export interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * 로그인·회원가입 탭 모달
 */
export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthFormMode>("login");

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === "login" ? "로그인" : "회원가입"}
      footer={
        <Link
          href={`/${mode === "login" ? "login" : "signup"}`}
          className="text-sm text-zinc-600 underline dark:text-zinc-400"
          onClick={onClose}
        >
          로그인 페이지로 이동 →
        </Link>
      }
    >
      <div className="rounded-lg bg-white p-6 dark:bg-zinc-900">
        <div className="mb-4 flex gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "login"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
            onClick={() => setMode("login")}
          >
            로그인
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              mode === "signup"
                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
            onClick={() => setMode("signup")}
          >
            회원가입
          </button>
        </div>
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
          문서를 저장하려면 로그인이 필요합니다.
        </p>
        <AuthForm
          mode={mode}
          onSuccess={() => {
            onSuccess();
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}
