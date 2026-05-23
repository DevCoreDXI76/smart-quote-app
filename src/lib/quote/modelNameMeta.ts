/**
 * @file lib/quote/modelNameMeta.ts
 * @description model_name DB 컬럼 없을 때 image_urls에 모델명을 보관·복원
 *
 * [보안·호환]
 * - urn:smart-quote:model: 접두사 URL은 이미지가 아니며 UI 그리드에서 제외합니다.
 * - model_name 컬럼 마이그레이션 후에는 DB 컬럼 값을 우선합니다.
 */

/** image_urls 내 모델명 메타 식별자 (실제 HTTP URL 아님) */
export const MODEL_NAME_META_PREFIX = "urn:smart-quote:model:";

export function isModelNameMetaUrl(url: string): boolean {
  return url.startsWith(MODEL_NAME_META_PREFIX);
}

/**
 * 저장용 image_urls — 모델명 메타 1건을 맨 뒤에 붙입니다.
 */
export function encodeModelNameInImageUrls(
  modelName: string,
  imageUrls: string[],
): string[] {
  const clean = imageUrls.filter((u) => !isModelNameMetaUrl(u));
  const trimmed = modelName.trim();
  if (!trimmed) return clean;
  return [...clean, `${MODEL_NAME_META_PREFIX}${encodeURIComponent(trimmed)}`];
}

/**
 * 조회 시 image_urls에서 모델명 복원 및 실제 이미지 URL만 분리
 */
export function decodeModelNameFromImageUrls(imageUrls: string[]): {
  modelName: string;
  imageUrls: string[];
} {
  const meta = imageUrls.find(isModelNameMetaUrl);
  const modelName = meta
    ? decodeURIComponent(meta.slice(MODEL_NAME_META_PREFIX.length))
    : "";
  return {
    modelName,
    imageUrls: imageUrls.filter((u) => !isModelNameMetaUrl(u)),
  };
}
