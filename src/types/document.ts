/**
 * @file types/document.ts
 * @description 견적서·구매사양서 PDF 문서 공통 타입
 */

/** 견적서 공급자(발행처) 정보 */
export interface SupplierInfo {
  companyName: string;
  address: string;
  phone: string;
  email?: string;
  businessNumber?: string;
  representative?: string;
}

/** 문서 메타 (발행일·문서번호) */
export interface DocumentMeta {
  issuedAt: Date;
  documentNo: string;
}
