/**
 * @file lib/pdf/fonts.ts
 * @description @react-pdf/renderer 폰트 등록 (한글 깨짐 방지)
 */

import { Font } from "@react-pdf/renderer";

let hasRegistered = false;

/**
 * Noto Sans KR 폰트를 등록합니다.
 * - 폰트 파일은 `public/fonts`에 있어야 합니다.
 * - 개발 환경: `node scripts/download-fonts.mjs` 실행 권장
 */
export function ensurePdfFontsRegistered() {
  if (hasRegistered) return;
  hasRegistered = true;

  Font.register({
    family: "NotoSansKR",
    fonts: [
      { src: "/fonts/NotoSansKR-Regular.otf", fontWeight: 400 },
      { src: "/fonts/NotoSansKR-Bold.otf", fontWeight: 700 },
    ],
  });
}

