import fs from "node:fs";
import path from "node:path";
import https from "node:https";

/**
 * Noto Sans KR 폰트를 public/fonts로 다운로드합니다.
 * 소스: googlefonts/noto-cjk (OTF)
 */

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public", "fonts");

const FILES = [
  {
    name: "NotoSansKR-Regular.otf",
    url: "https://raw.githubusercontent.com/googlefonts/noto-cjk/Sans2.004/Sans/SubsetOTF/KR/NotoSansKR-Regular.otf",
  },
  {
    name: "NotoSansKR-Bold.otf",
    url: "https://raw.githubusercontent.com/googlefonts/noto-cjk/Sans2.004/Sans/SubsetOTF/KR/NotoSansKR-Bold.otf",
  },
];

function download(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https
      .get(url, (res) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          return resolve(download(res.headers.location, destPath));
        }
        if (res.statusCode !== 200) {
          file.close();
          return reject(new Error(`Download failed (${res.statusCode}): ${url}`));
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (err) => {
        file.close();
        reject(err);
      });
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const f of FILES) {
    const dest = path.join(OUT_DIR, f.name);
    process.stdout.write(`Downloading ${f.name}... `);
    await download(f.url, dest);
    process.stdout.write("OK\n");
  }

  process.stdout.write("Fonts are ready in public/fonts\n");
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

