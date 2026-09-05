import type { Pick } from "@/types";

export type DigestMode = "weekly" | "standout" | "favorites";

export interface DigestOptions {
  mode?: DigestMode;
  limit?: number;
  /** favorites モード用 */
  favorites?: Set<string>;
  /** ジャンルごとの上限（偏り防止） */
  perGenreCap?: number;
}

/**
 * ストーリーズ・ダイジェストに載せる picks を選ぶ。
 * weekly: 新着×信頼度でスコアリング。standout: 定番(trust3)中心。favorites: お気に入りのみ。
 * いずれもジャンル偏りを抑えつつ上限まで。データ件数が増えても破綻しない。
 */
export function buildDigest(picks: Pick[], opts: DigestOptions = {}): Pick[] {
  const { mode = "weekly", limit = 12, favorites, perGenreCap = 3 } = opts;

  let pool = picks;
  if (mode === "weekly") {
    // 直近14日（データ最新日基準）。足りなければ30日→全件へ広げる
    const latest = picks.reduce((m, p) => (p.dateAdded > m ? p.dateAdded : m), "");
    for (const days of [14, 30]) {
      const since = shiftDate(latest, -days);
      pool = picks.filter((p) => p.dateAdded >= since);
      if (pool.length >= limit) break;
    }
    if (pool.length < limit) pool = picks;
  } else if (mode === "favorites") {
    const fav = favorites ?? new Set<string>();
    pool = picks.filter((p) => fav.has(p.id));
  } else if (mode === "standout") {
    pool = picks.filter((p) => p.trust >= 3);
    if (pool.length < Math.min(limit, picks.length)) pool = picks; // 少なすぎたら全件から
  }

  // スコア: 信頼度を主、新着を従。weekly は新着の比重を上げる
  const recencyWeight = mode === "weekly" ? 1 : 0.5;
  const scored = [...pool].sort((a, b) => {
    const sa = a.trust * 10 + dateScore(a.dateAdded) * recencyWeight;
    const sb = b.trust * 10 + dateScore(b.dateAdded) * recencyWeight;
    if (sb !== sa) return sb - sa;
    return a.name.localeCompare(b.name);
  });

  // ジャンル上限を効かせながら詰める。足りなければ上限を緩める
  const out: Pick[] = [];
  const perGenre: Record<string, number> = {};
  for (const p of scored) {
    if (out.length >= limit) break;
    if ((perGenre[p.genre] ?? 0) >= perGenreCap) continue;
    out.push(p);
    perGenre[p.genre] = (perGenre[p.genre] ?? 0) + 1;
  }
  if (out.length < limit) {
    for (const p of scored) {
      if (out.length >= limit) break;
      if (!out.includes(p)) out.push(p);
    }
  }
  return out;
}

/** "YYYY-MM-DD" を days 日ずらす（不正値はそのまま返す） */
function shiftDate(iso: string, days: number): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return iso;
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" を比較用の数値に（新しいほど大）。不正値は 0 */
function dateScore(iso: string): number {
  const n = Number(String(iso).replace(/-/g, ""));
  return Number.isFinite(n) ? n / 10000 : 0;
}
