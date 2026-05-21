/**
 * @file components/quote/AiPriceAnalysisPanel.tsx
 * @description AI 가격 분석 — Min/Max/Avg 선택, 출처 링크, USD→KRW 환율 안내
 */

"use client";

import { useEffect } from "react";

import { Badge } from "@/components/common/Badge";
import { formatKRW } from "@/lib/format/currency";
import type {
  AiCurrencyConversion,
  AiPriceSource,
  AiPriceTrend,
  AiUsdPriceSnapshot,
} from "@/types/aiSearch";

export interface AiPriceAnalysisPanelProps {
  priceTrend: AiPriceTrend;
  priceSources: AiPriceSource[];
  /** Min/Max/Avg 클릭 시 단가 입력란에 반영 */
  onSelectPrice: (amount: number) => void;
  /** 현재 선택된 가격 (하이라이트용) */
  selectedAmount?: number | null;
  /** USD→KRW 환산 메타 */
  currencyConversion?: AiCurrencyConversion;
  /** 조사된 원래 달러 가격 */
  originalPriceInUsd?: AiUsdPriceSnapshot;
}

function formatUsdDisplay(snapshot?: AiUsdPriceSnapshot): string | null {
  if (!snapshot) return null;
  if (snapshot.display?.trim()) return snapshot.display.trim();

  const usdFmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const parts: string[] = [];
  if (snapshot.min != null && snapshot.min > 0) {
    parts.push(usdFmt.format(snapshot.min));
  }
  if (
    snapshot.max != null &&
    snapshot.max > 0 &&
    snapshot.max !== snapshot.min
  ) {
    const maxStr = usdFmt.format(snapshot.max);
    return parts.length > 0 ? `${parts[0]} ~ ${maxStr}` : maxStr;
  }
  if (snapshot.avg != null && snapshot.avg > 0 && parts.length === 0) {
    return usdFmt.format(snapshot.avg);
  }
  return parts[0] ?? null;
}

/**
 * 가격 트렌드 바 + 클릭 가능 Min/Max/Avg 배지 + 출처 링크
 */
export function AiPriceAnalysisPanel({
  priceTrend,
  priceSources,
  onSelectPrice,
  selectedAmount = null,
  currencyConversion,
  originalPriceInUsd,
}: AiPriceAnalysisPanelProps) {
  const { min, max, avg } = priceTrend;
  const range = max - min || 1;
  const avgPercent = Math.min(100, Math.max(0, ((avg - min) / range) * 100));

  const priceOptions = [
    { key: "min" as const, label: "최저가", value: min },
    { key: "avg" as const, label: "평균가", value: avg },
    { key: "max" as const, label: "최고가", value: max },
  ];

  const showUsdNotice = currencyConversion?.wasConvertedFromUsd === true;
  const rateLabel = currencyConversion?.exchangeRateUsed
    ? currencyConversion.exchangeRateUsed.toLocaleString("ko-KR")
    : null;
  const usdRangeLabel = formatUsdDisplay(originalPriceInUsd);

  // #region agent log
  useEffect(() => {
    const keys = priceSources.map((s) => `${s.siteName}-${s.url}`);
    const duplicateKeys = keys.filter((k, i) => keys.indexOf(k) !== i);
    fetch("http://127.0.0.1:7550/ingest/f16fd58e-aa65-43e7-aa59-0ca343cd20e0", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "b0a6db",
      },
      body: JSON.stringify({
        sessionId: "b0a6db",
        hypothesisId: "C",
        location: "AiPriceAnalysisPanel.tsx:render",
        message: "priceSources keys at UI render",
        data: {
          count: priceSources.length,
          duplicateKeys: [...new Set(duplicateKeys)],
          keys,
        },
        timestamp: Date.now(),
        runId: "post-fix",
      }),
    }).catch(() => {});
  }, [priceSources]);
  // #endregion

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/50">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
        AI 가격 분석 정보
      </h3>

      {showUsdNotice && rateLabel ? (
        <div className="mb-3 flex flex-col gap-1.5">
          <Badge variant="outline" className="w-fit text-xs font-normal">
            현지 달러($) 가격 조사됨 · 환율 {rateLabel}원/USD 적용
            {currencyConversion?.source === "fallback" ? " (예비 환율)" : ""}
          </Badge>
          {usdRangeLabel ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              조사 달러 가격: {usdRangeLabel}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {priceOptions.map(({ key, label, value }) => (
          <Badge
            key={key}
            type="button"
            variant={selectedAmount === value ? "primary" : "outline"}
            onClick={() => onSelectPrice(value)}
            className="cursor-pointer"
          >
            {label} {formatKRW(value)}
          </Badge>
        ))}
      </div>

      <div className="mb-4">
        <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
          <div
            className="absolute inset-y-0 left-0 w-full rounded-full bg-zinc-400 dark:bg-zinc-500"
            aria-hidden
          />
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-zinc-900 shadow dark:border-zinc-900 dark:bg-zinc-100"
            style={{ left: `${avgPercent}%` }}
            title={`평균 ${formatKRW(avg)}`}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatKRW(min)}</span>
          <span>평균 {formatKRW(avg)}</span>
          <span>{formatKRW(max)}</span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          가격 조사 출처
        </p>
        <ul className="flex flex-col gap-1.5">
          {priceSources.map((source) => (
            <li key={`${source.siteName}-${source.url}`}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {source.siteName} — {formatKRW(source.price)}
                {source.originalPriceInUsd != null &&
                source.originalPriceInUsd > 0
                  ? ` (USD ${source.originalPriceInUsd.toLocaleString("en-US")})`
                  : ""}
              </a>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        최저가·평균가·최고가를 클릭하면 아래 단가(원)에 자동 입력됩니다.
      </p>
    </section>
  );
}
