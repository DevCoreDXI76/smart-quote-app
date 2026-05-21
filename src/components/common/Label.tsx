/**
 * @file components/common/Label.tsx
 * @description 폼 필드용 공통 라벨 컴포넌트
 */

import type { LabelHTMLAttributes, ReactNode } from "react";

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  /** 라벨에 표시할 텍스트 */
  children: ReactNode;
  /** 연결할 input의 id (htmlFor) */
  htmlFor?: string;
}

/**
 * 폼 입력 필드 라벨
 */
export function Label({ children, className = "", ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-zinc-700 dark:text-zinc-300 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
