/**
 * @file lib/searchService.ts
 * @description Serper API를 통한 구글 이미지·웹 검색 모듈
 *
 * 흐름: api/ai-search → runProductSearch → Serper → SearchBundle → llmService
 */

import { buildProductSearchQueries } from "@/lib/ai/searchQueries";

const SERPER_IMAGES_URL = "https://google.serper.dev/images";
const SERPER_SEARCH_URL = "https://google.serper.dev/search";

/** Serper 이미지 검색 결과 1건 */
interface SerperImageItem {
  imageUrl?: string;
  title?: string;
  source?: string;
  link?: string;
}

/** Serper 웹 검색 organic 1건 */
interface SerperOrganicItem {
  title?: string;
  snippet?: string;
  link?: string;
}

interface SerperImagesResponse {
  images?: SerperImageItem[];
}

interface SerperSearchResponse {
  organic?: SerperOrganicItem[];
}

/** 이미지 검색 후보 */
export interface ImageSearchCandidate {
  url: string;
  title?: string;
  source?: string;
}

/** 웹 검색 스니펫 */
export interface WebSearchSnippet {
  title: string;
  snippet: string;
  link: string;
}

/** LLM에 전달할 검색 원시 데이터 묶음 */
export interface SearchBundle {
  productName: string;
  imageCandidates: ImageSearchCandidate[];
  webSnippets: WebSearchSnippet[];
}

/**
 * Serper API POST 호출 (공통)
 */
async function serperPost<T>(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-KEY": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Serper API 오류 (${response.status}): ${text.slice(0, 200) || response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

/**
 * 이미지 검색 1회 실행
 */
async function searchImages(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<ImageSearchCandidate[]> {
  const data = await serperPost<SerperImagesResponse>(
    SERPER_IMAGES_URL,
    apiKey,
    { q: query, gl: "kr", hl: "ko", num: 10 },
    signal,
  );

  const candidates: ImageSearchCandidate[] = [];
  for (const item of data.images ?? []) {
    const url = item.imageUrl ?? item.link ?? "";
    if (!url.startsWith("http")) continue;
    candidates.push({
      url,
      title: item.title,
      source: item.source,
    });
  }
  return candidates;
}

/**
 * 웹(organic) 검색 1회 실행
 */
async function searchWeb(
  query: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<WebSearchSnippet[]> {
  const data = await serperPost<SerperSearchResponse>(
    SERPER_SEARCH_URL,
    apiKey,
    { q: query, gl: "kr", hl: "ko", num: 10 },
    signal,
  );

  const snippets: WebSearchSnippet[] = [];
  for (const item of data.organic ?? []) {
    const link = item.link ?? "";
    if (!link.startsWith("http")) continue;
    snippets.push({
      title: item.title ?? "",
      snippet: item.snippet ?? "",
      link,
    });
  }
  return snippets;
}

/**
 * 제품명으로 이미지·웹 검색을 병렬 실행하고 후보를 모읍니다.
 * @param productName - 사용자 입력 제품명
 * @param serperApiKey - Serper API 키
 * @param signal - AbortSignal (타임아웃)
 */
export async function runProductSearch(
  productName: string,
  serperApiKey: string,
  signal?: AbortSignal,
): Promise<SearchBundle> {
  const queries = buildProductSearchQueries(productName);

  const imagePromises = queries.imageQueries.map((q) =>
    searchImages(q, serperApiKey, signal),
  );
  const webPromise = searchWeb(queries.webQuery, serperApiKey, signal);

  const [imageGroups, webSnippets] = await Promise.all([
    Promise.all(imagePromises),
    webPromise,
  ]);

  const seenUrls = new Set<string>();
  const imageCandidates: ImageSearchCandidate[] = [];

  for (const group of imageGroups) {
    for (const candidate of group) {
      if (seenUrls.has(candidate.url)) continue;
      seenUrls.add(candidate.url);
      imageCandidates.push(candidate);
    }
  }

  return {
    productName: queries.productName,
    imageCandidates,
    webSnippets,
  };
}
