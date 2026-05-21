/**
 * @file lib/ai/searchQueries.ts
 * @description Serper 검색용 쿼리 문자열 생성 (제품명 + 각도·스펙 키워드)
 */

export interface ProductSearchQueries {
  productName: string;
  imageQueries: string[];
  webQuery: string;
}

/**
 * 제품명 기반 이미지·웹 검색 쿼리 세트를 만듭니다.
 * @param productName - 사용자 입력 제품명/모델명
 */
export function buildProductSearchQueries(
  productName: string,
): ProductSearchQueries {
  const name = productName.trim();

  return {
    productName: name,
    imageQueries: [
      `${name} 공식 제품 정면`,
      `${name} 후면 디자인`,
      `${name} 측면 외관`,
      `${name} official product photo`,
    ],
    webQuery: `${name} 스펙 가격 제조사`,
  };
}
