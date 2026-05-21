/**
 * @file components/common/Badge.tsx
 * @description 태그·가격 라벨용 배지 컴포넌트
 */

import type { ButtonHTMLAttributes, ReactNode } from "react";

export type BadgeVariant = "default" | "primary" | "outline";

export interface BadgeProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  /** button이 아닌 span으로 렌더 (기능 태그용) */
  asSpan?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  primary:
    "bg-zinc-900 text-white ring-2 ring-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:ring-zinc-100",
  outline:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800",
};

/**
 * 작은 라벨·클릭 가능한 가격 배지
 */
export function Badge({
  children,
  variant = "default",
  asSpan = false,
  className = "",
  type = "button",
  ...props
}: BadgeProps) {
  const classes = `inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors ${variantClasses[variant]} ${className}`;

  if (asSpan) {
    return <span className={classes}>{children}</span>;
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
