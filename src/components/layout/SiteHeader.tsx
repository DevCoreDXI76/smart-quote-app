/**
 * @file components/layout/SiteHeader.tsx
 * @description 전역 네비게이션·로그인 상태 표시
 */

"use client";

import Link from "next/link";

import { Button } from "@/components/common/Button";
import { useAuth } from "@/hooks/useAuth";

/**
 * 앱 공통 헤더 (홈, 마이페이지, 공유 게시판, 로그인/로그아웃)
 */
export function SiteHeader() {
  const { user, isLoading, isAdmin, signOut, isConfigured } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Smart Quote
          </Link>
          <nav className="flex flex-wrap gap-4 text-sm">
            <Link
              href="/"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              견적 작성
            </Link>
            <Link
              href="/dashboard"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              마이페이지
            </Link>
            <Link
              href="/shared"
              className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              공유 게시판
            </Link>
            {isAdmin ? (
              <Link
                href="/admin"
                className="font-medium text-amber-700 hover:text-amber-900 dark:text-amber-400"
              >
                관리자
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {!isConfigured ? (
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Supabase 미설정 (.env.local)
            </span>
          ) : null}
          {isLoading ? (
            <span className="text-sm text-zinc-500">세션 확인 중...</span>
          ) : user ? (
            <>
              <span className="max-w-[200px] truncate text-sm text-zinc-600 dark:text-zinc-400">
                {user.email}
              </span>
              <Button variant="secondary" onClick={() => signOut()}>
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="secondary">로그인</Button>
              </Link>
              <Link href="/signup">
                <Button variant="primary">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
