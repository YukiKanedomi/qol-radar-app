// data/picks.json（唯一の正本）を public/data/picks.json（配信用）へコピーする。
// dev 起動時(predev)・ビルド時(prebuild)に自動実行され、2ファイルの食い違いを防ぐ。
import { mkdirSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "data", "picks.json");
const destDir = path.join(root, "public", "data");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, path.join(destDir, "picks.json"));
console.log("synced: data/picks.json -> public/data/picks.json");
