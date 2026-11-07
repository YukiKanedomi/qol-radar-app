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
//   2026-11-07: id が違っても、名前の正規化一致（全半角・大小・空白・記号を無視）か
//   名前に含まれる型番（英字+数字5文字以上）の一致でも既出扱いにしてスキップする。
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

// 名前の正規化: 全半角(NFKC)・大小を揃え、空白・記号を除去
function normName(s) {
  return String(s ?? "").normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

// 名前から型番らしきトークン（英字と数字を両方含み、ハイフン除去後5文字以上）を拾う。
// ブランド名や「10-in-1」のような仕様表記は型番ではないので除外する。
const NOT_MODEL = new Set(["insta360", "3coins", "1password"]);
function modelCodes(s) {
  const out = [];
  for (const m of String(s ?? "").normalize("NFKC").matchAll(/[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9]/g)) {
    const t = m[0].toLowerCase().replace(/-/g, "");
    if (t.length < 5 || !/[a-z]/.test(t) || !/[0-9]/.test(t)) continue;
    if (NOT_MODEL.has(t) || /^\d+in\d+$/.test(t)) continue;
    out.push(t);
  }
  return out;
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
const nameIndex = new Map(); // 正規化名 -> id
const codeIndex = new Map(); // 型番 -> id
function indexPick(p) {
  const k = normName(p.name);
  if (k && !nameIndex.has(k)) nameIndex.set(k, p.id);
  for (const c of modelCodes(p.name)) if (!codeIndex.has(c)) codeIndex.set(c, p.id);
}
db.picks.forEach(indexPick);
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
  const sameName = nameIndex.get(normName(c.name));
  const sameCode = modelCodes(c.name).find((m) => codeIndex.has(m));
  if (sameName || sameCode) {
    skipped++;
    const hit = sameName ? `名前一致 → ${sameName}` : `型番 ${sameCode} 一致 → ${codeIndex.get(sameCode)}`;
    log.push(`  = skip (既出 ${hit}): ${id} (${c.name})`);
    continue;
  }
  db.picks.push({
    id,
    name: c.name,
    genre: c.genre,
    trust: clampInt(c.trust, 1, 3, 1),
    priceTier: clampInt(c.priceTier, 1, 3, 2),
    blurb: c.blurb || "",
    points: Array.isArray(c.points) ? c.points.slice(0, 3) : [],
    tags: Array.isArray(c.tags) ? c.tags : [],
    dateAdded: c.dateAdded || today,
    status: "new",
    sources: Array.isArray(c.sources) ? c.sources : [],
  });
  existing.add(id);
  indexPick({ id, name: c.name });
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
