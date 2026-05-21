import { QuoteEditor } from "@/components/quote";

export default function Home() {
  return (
    <div className="min-h-full bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-6 py-6">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Smart Quote — 견적서 작성
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            품목을 입력하고 견적 합계를 확인한 뒤, 견적서·구매사양서 PDF를
            출력하세요.
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">
        <QuoteEditor />
      </main>
    </div>
  );
}
