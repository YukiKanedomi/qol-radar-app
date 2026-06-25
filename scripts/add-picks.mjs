// 収集した候補アイテムを data/picks.json（正本）へ重複なく追記する。
//
//   node scripts/add-picks.mjs <candidates.json>
//
// candidates.json は Pick 候補の配列。各要素の最低限のキー:
//   { "name": "...", "genre": "gadget|housework|work|health|service",
//     "trust": 1-3, "priceTier": 1-3, "blurb": "...", "tags": ["..."],
//     "sources": ["https://..."], "id": "任意（無ければ name から生成）" }
//
// 仕様（SPEC §7）: id(kebab-case) で重複判定 → 既存はスキップ、新顔のみ append。
//   dateAdded を当日(JST)で付与、status は "new"。meta.lastUpdated を更新。
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataPath = path.join(root, "data", "picks.json");
const GENRES = ["gadget", "housework", "work", "health", "service"];

function todayJST() {
  // en-CA ロケールは YYYY-MM-DD 形式
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function kebab(s) {
  return (
    String(s)
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // 日本語等は落ちる→ id は英数指定推奨
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 48) || ""
  );
}

function clampInt(v, min, max, fallback) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

const inputArg = process.argv[2];
if (!inputArg) {
  console.error("usage: node scripts/add-picks.mjs <candidates.json>");
  process.exit(1);
}

// BOM を除去（外部ツール由来の候補ファイル対策）
const raw = readFileSync(path.resolve(inputArg), "utf8").replace(/^﻿/, "");
const candidates = JSON.parse(raw);
if (!Array.isArray(candidates)) {
  console.error("error: candidates.json must be a JSON array");
  process.exit(1);
}

const db = JSON.parse(readFileSync(dataPath, "utf8"));
const existing = new Set(db.picks.map((p) => p.id));
const today = todayJST();

let added = 0;
let skipped = 0;
const log = [];

for (const c of candidates) {
  const id = kebab(c.id || c.name);
  if (!c.name || !id) {
    skipped++;
    log.push(`  ! skip (name/id 不正): ${c.name ?? c.id ?? "?"}`);
    continue;
  }
  if (!GENRES.includes(c.genre)) {
    skipped++;
    log.push(`  ! skip (genre 不正 "${c.genre}"): ${c.name}`);
    continue;
  }
  if (existing.has(id)) {
    skipped++;
    log.push(`  = skip (既出 id): ${id}`);
    continue;
  }
  db.picks.push({
    id,
    name: c.name,
    genre: c.genre,
    trust: clampInt(c.trust, 1, 3, 1),
    priceTier: clampInt(c.priceTier, 1, 3, 2),
    blurb: c.blurb || "",
    tags: Array.isArray(c.tags) ? c.tags : [],
    dateAdded: c.dateAdded || today,
    status: "new",
    sources: Array.isArray(c.sources) ? c.sources : [],
  });
  existing.add(id);
  added++;
  log.push(`  + add: ${id} (${c.name})`);
}

if (added > 0) {
  db.meta.lastUpdated = today;
  writeFileSync(dataPath, JSON.stringify(db, null, 2) + "\n", "utf8");
}

console.log(`add-picks: added ${added}, skipped ${skipped} (total ${db.picks.length})`);
log.forEach((l) => console.log(l));
if (added === 0) console.log("（変更なし: data/picks.json は未更新）");
