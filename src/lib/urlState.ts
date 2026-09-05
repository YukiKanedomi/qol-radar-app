import type { Status } from "@/types";
import { defaultFilterState, type FilterState, type SortKey } from "./filtering";

/**
 * フィルター状態 ⇄ URL クエリ。
 * 「健康の★3だけ」を相手に送れる・リロードしても消えない・戻るで元に戻る、のために
 * 既定値と違う項目だけを短いキーで載せる（g=ジャンル t=信頼度 p=価格 s=状態 q=検索 sort=並び）。
 * item=<id> は1件を開いた状態で表示するディープリンク。
 * 履歴は「離散的な操作（チップ・並び替え）は push、検索の打鍵は replace」。
 */
const SORT_KEYS: SortKey[] = ["newest", "trust", "price"];
const STATUS_KEYS: Status[] = ["new", "interested", "bought", "skip"];

export function filtersToParams(f: FilterState): URLSearchParams {
  const p = new URLSearchParams();
  if (f.genre !== "all") p.set("g", f.genre);
  if (f.minTrust > 0) p.set("t", String(f.minTrust));
  if (f.prices.length > 0) p.set("p", [...f.prices].sort().join(","));
  if (f.statuses.length > 0) p.set("s", f.statuses.join(","));
  if (f.favoritesOnly) p.set("fav", "1");
  if (f.query.trim()) p.set("q", f.query.trim());
  if (f.sort !== "newest") p.set("sort", f.sort);
  return p;
}

export function paramsToFilters(p: URLSearchParams): FilterState {
  const f: FilterState = { ...defaultFilterState, prices: [], statuses: [] };
  const g = p.get("g");
  if (g) f.genre = g;
  const t = Number(p.get("t"));
  if (t >= 1 && t <= 3) f.minTrust = t;
  const prices = (p.get("p") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => n >= 1 && n <= 3);
  if (prices.length) f.prices = prices;
  const statuses = (p.get("s") ?? "")
    .split(",")
    .filter((s): s is Status => (STATUS_KEYS as string[]).includes(s));
  if (statuses.length) f.statuses = statuses;
  if (p.get("fav") === "1") f.favoritesOnly = true;
  const q = p.get("q");
  if (q) f.query = q;
  const sort = p.get("sort");
  if (sort && (SORT_KEYS as string[]).includes(sort)) f.sort = sort as SortKey;
  return f;
}

export function readUrl(): { filters: FilterState; item: string | null } {
  const p = new URLSearchParams(location.search);
  return { filters: paramsToFilters(p), item: p.get("item") };
}

/** 2つの状態の差が「検索語だけ」か（打鍵ごとに履歴を積まないための判定） */
export function onlyQueryDiffers(a: FilterState, b: FilterState): boolean {
  const { query: qa, ...ra } = a;
  const { query: qb, ...rb } = b;
  return qa !== qb && JSON.stringify(ra) === JSON.stringify(rb);
}

/** URL を更新する。既存の history.state（ダイジェスト開閉など）は引き継ぐ */
export function writeUrl(
  f: FilterState,
  item: string | null,
  mode: "push" | "replace",
): void {
  const p = filtersToParams(f);
  if (item) p.set("item", item);
  const qs = p.toString();
  const next = location.pathname + (qs ? "?" + qs : "") + location.hash;
  const cur = location.pathname + location.search + location.hash;
  if (next === cur) return;
  if (mode === "push") history.pushState(history.state, "", next);
  else history.replaceState(history.state, "", next);
}

/** 1件のディープリンク URL */
export function itemUrl(id: string): string {
  return location.origin + location.pathname + "?item=" + encodeURIComponent(id);
}
