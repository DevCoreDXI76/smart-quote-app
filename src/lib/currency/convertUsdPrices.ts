/**
 * @file lib/currency/convertUsdPrices.ts
 * @description USD 금액을 KRW 정수로 환산하는 순수 함수
 */

/** USD → KRW (원 단위 반올림) */
export function convertUsdToKrw(usd: number, rate: number): number {
  if (!Number.isFinite(usd) || usd < 0) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(usd * rate);
}

export interface UsdTrend {
  min?: number;
  max?: number;
  avg?: number;
}

export interface KrwTrend {
  min: number;
  max: number;
  avg: number;
}

/**
 * min/max/avg USD 트렌드를 KRW 정수로 일괄 환산합니다.
 */
export function convertUsdTrendToKrw(
  trend: UsdTrend,
  rate: number,
): KrwTrend {
  const min =
    trend.min != null ? convertUsdToKrw(trend.min, rate) : 0;
  const max =
    trend.max != null ? convertUsdToKrw(trend.max, rate) : 0;
  const avg =
    trend.avg != null
      ? convertUsdToKrw(trend.avg, rate)
      : min && max
        ? Math.round((min + max) / 2)
        : min || max;

  return { min, max, avg };
}

/**
 * USD 금액을 한국 로케일 표시 문자열로 포맷합니다.
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * USD min~max 범위 표시 문자열 (예: "$1,299 ~ $1,499")
 */
export function formatUsdRange(snapshot: UsdTrend): string | undefined {
  const parts: string[] = [];
  if (snapshot.min != null && snapshot.min > 0) {
    parts.push(formatUsd(snapshot.min));
  }
  if (snapshot.max != null && snapshot.max > 0 && snapshot.max !== snapshot.min) {
    if (parts.length > 0) {
      return `${parts[0]} ~ ${formatUsd(snapshot.max)}`;
    }
    return formatUsd(snapshot.max);
  }
  if (snapshot.avg != null && snapshot.avg > 0 && parts.length === 0) {
    return formatUsd(snapshot.avg);
  }
  return parts[0];
}
