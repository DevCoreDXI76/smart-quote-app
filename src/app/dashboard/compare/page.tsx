/**
 * @file app/dashboard/compare/page.tsx
 * @description 두 견적 문서 금액·품목 사양 비교
 */

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/common/Button";
import { fetchDocumentById } from "@/lib/supabase/fetchDocument";
import { calculateQuoteTotals } from "@/lib/calculations/quoteTotals";
import { formatKRW } from "@/lib/format/currency";
import { useAuth } from "@/hooks/useAuth";
import type { DocumentMaster } from "@/types";

function CompareContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const idA = searchParams.get("a");
  const idB = searchParams.get("b");

  const [docA, setDocA] = useState<DocumentMaster | null>(null);
  const [docB, setDocB] = useState<DocumentMaster | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || user) return;
    router.replace("/login?redirect=/dashboard/compare");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user) return;

    const timer = window.setTimeout(() => {
      if (!idA || !idB) {
        setError("비교할 문서 2건을 선택해 주세요.");
        setLoading(false);
        return;
      }

      const load = async () => {
        setLoading(true);
        setError(null);
        try {
          const [a, b] = await Promise.all([
            fetchDocumentById(idA),
            fetchDocumentById(idB),
          ]);
          if (!a || !b) {
            setError("문서를 찾을 수 없습니다.");
            return;
          }
          if (a.userId !== user.id || b.userId !== user.id) {
            setError("본인 문서만 비교할 수 있습니다.");
            return;
          }
          setDocA(a);
          setDocB(b);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "비교 데이터 로드 실패",
          );
        } finally {
          setLoading(false);
        }
      };

      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [authLoading, user, idA, idB]);

  if (authLoading || loading) {
    return <p className="text-sm text-zinc-500">비교 데이터 로딩 중...</p>;
  }

  if (error || !docA || !docB) {
    return (
      <div>
        <p className="mb-4 text-sm text-red-600" role="alert">
          {error ?? "문서를 불러올 수 없습니다."}
        </p>
        <Link href="/dashboard">
          <Button variant="secondary">마이페이지로</Button>
        </Link>
      </div>
    );
  }

  const totalsA = calculateQuoteTotals(docA.items);
  const totalsB = calculateQuoteTotals(docB.items);
  const maxRows = Math.max(docA.items.length, docB.items.length);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        문서 비교
      </h1>

      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <SummaryCard
          title={docA.title}
          itemCount={docA.items.length}
          supply={totalsA.supplyAmount}
          vat={totalsA.vatAmount}
          total={totalsA.totalAmount}
        />
        <SummaryCard
          title={docB.title}
          itemCount={docB.items.length}
          supply={totalsB.supplyAmount}
          vat={totalsB.vatAmount}
          total={totalsB.totalAmount}
        />
      </div>

      <h2 className="mb-4 text-lg font-semibold">품목별 비교</h2>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3" colSpan={3}>
                {docA.title}
              </th>
              <th className="px-4 py-3" colSpan={3}>
                {docB.title}
              </th>
            </tr>
            <tr className="text-xs text-zinc-500">
              <th className="px-4 py-2" />
              <th className="px-4 py-2">품명</th>
              <th className="px-4 py-2">단가</th>
              <th className="px-4 py-2">스펙 요약</th>
              <th className="px-4 py-2">품명</th>
              <th className="px-4 py-2">단가</th>
              <th className="px-4 py-2">스펙 요약</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }, (_, i) => {
              const itemA = docA.items[i];
              const itemB = docB.items[i];
              return (
                <tr
                  key={i}
                  className="border-b border-zinc-100 dark:border-zinc-800"
                >
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">{itemA?.productName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {itemA ? formatKRW(itemA.unitPrice) : "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-zinc-600">
                    {itemA?.detailedSpec?.slice(0, 80) ?? "—"}
                  </td>
                  <td className="px-4 py-3">{itemB?.productName ?? "—"}</td>
                  <td className="px-4 py-3">
                    {itemB ? formatKRW(itemB.unitPrice) : "—"}
                  </td>
                  <td className="max-w-[180px] truncate px-4 py-3 text-zinc-600">
                    {itemB?.detailedSpec?.slice(0, 80) ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Link href="/dashboard">
          <Button variant="secondary">마이페이지로</Button>
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  itemCount,
  supply,
  vat,
  total,
}: {
  title: string;
  itemCount: number;
  supply: number;
  vat: number;
  total: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
      <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-400">
        <li>품목 수: {itemCount}</li>
        <li>공급가액: {formatKRW(supply)}</li>
        <li>부가세: {formatKRW(vat)}</li>
        <li className="font-medium text-zinc-900 dark:text-zinc-100">
          총 합계: {formatKRW(total)}
        </li>
      </ul>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">로딩 중...</p>}>
      <CompareContent />
    </Suspense>
  );
}
