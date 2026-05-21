/**
 * @file lib/document/defaultSupplier.ts
 * @description 견적서 공급자 기본 정보 (추후 설정·DB 연동 시 교체)
 */

import type { SupplierInfo } from "@/types/document";

/** 기본 공급자 정보 — 데모·로컬 출력용 */
export const DEFAULT_SUPPLIER: SupplierInfo = {
  companyName: "(주)스마트견적",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  email: "contact@smartquote.example",
  businessNumber: "123-45-67890",
  representative: "홍길동",
};
