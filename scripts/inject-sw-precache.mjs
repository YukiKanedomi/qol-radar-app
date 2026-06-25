// ビルド後に dist/sw.js へハッシュ付きアセットの precache リストを注入する。
// これにより install 時にアプリ本体をキャッシュでき、初回訪問後はオフラインでも開ける。
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASE = "/qol-radar-app/";
const swPath = path.join(root, "dist", "sw.js");
const assetsDir = path.join(root, "dist", "assets");

if (!existsSync(swPath)) {
  console.warn("inject-sw-precache: dist/sw.js が見つかりません（スキップ）");
  process.exit(0);
}

const assets = existsSync(assetsDir)
  ? readdirSync(assetsDir)
      .filter((f) => /\.(js|css)$/.test(f))
      .map((f) => `${BASE}assets/${f}`)
  : [];

let sw = readFileSync(swPath, "utf8");
const injected = `const BUILD_ASSETS = ${JSON.stringify(assets)};`;
sw = sw.replace(/const BUILD_ASSETS = \[\];\s*\/\*__PRECACHE_INJECT__\*\//, injected);
writeFileSync(swPath, sw, "utf8");

console.log(`inject-sw-precache: ${assets.length} 件のアセットを precache に注入`);
assets.forEach((a) => console.log("  •", a));
