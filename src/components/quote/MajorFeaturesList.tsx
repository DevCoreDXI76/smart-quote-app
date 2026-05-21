/**
 * @file components/quote/MajorFeaturesList.tsx
 * @description AI가 찾은 주요 기능을 태그 형태로 표시
 */

"use client";

import { Badge } from "@/components/common/Badge";

export interface MajorFeaturesListProps {
  features: string[];
}

/**
 * 주요 기능 태그 목록 (features가 비어 있으면 렌더하지 않음)
 */
export function MajorFeaturesList({ features }: MajorFeaturesListProps) {
  if (features.length === 0) return null;

  return (
    <section className="flex flex-col gap-2">
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">주요 기능</p>
      <ul className="flex flex-wrap gap-2">
        {features.map((feature) => (
          <li key={feature}>
            <Badge asSpan variant="default">
              {feature}
            </Badge>
          </li>
        ))}
      </ul>
    </section>
  );
}
