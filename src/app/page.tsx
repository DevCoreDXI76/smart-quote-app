import { QuoteEditorLoader } from "@/components/quote/QuoteEditorLoader";

export default function Home() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        견적서 작성
      </h1>
      <p className="mb-8 text-sm text-zinc-600 dark:text-zinc-400">
        품목을 입력하고 견적 합계를 확인한 뒤, Supabase에 저장하거나 PDF로
        출력하세요.
      </p>
      <QuoteEditorLoader />
    </div>
  );
}
