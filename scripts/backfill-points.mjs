// 既存アイテムに「推しポイント」(points) を一括付与する。
//   node scripts/backfill-points.mjs <points-map.json>
// points-map.json は { "<id>": ["ポイント1","ポイント2",...], ... } の形。
// 既存 id にだけ反映（最大3点）。他フィールドは触らない。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "picks.json");

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("usage: node scripts/backfill-points.mjs <points-map.json>");
  process.exit(1);
}

const raw = readFileSync(path.resolve(inputArg), "utf8").replace(/^﻿/, "");
const map = JSON.parse(raw);
const db = JSON.parse(readFileSync(dataPath, "utf8"));

let updated = 0;
const missing = [];
for (const pick of db.picks) {
  const pts = map[pick.id];
  if (Array.isArray(pts) && pts.length) {
    pick.points = pts.slice(0, 3);
    updated++;
  } else if (!Array.isArray(pick.points) || pick.points.length === 0) {
    missing.push(pick.id);
  }
}

writeFileSync(dataPath, JSON.stringify(db, null, 2) + "\n", "utf8");
console.log(`backfill-points: ${updated} 件に points を付与（total ${db.picks.length}）`);
if (missing.length) console.log("  points 未設定:", missing.join(", "));
