import type { Genre, Pick, PicksData } from "@/types";

/** picks.json を BASE_URL 起点で取得（GitHub Pages のサブパス配信に対応） */
export async function loadPicks(): Promise<PicksData> {
  const res = await fetch(import.meta.env.BASE_URL + "data/picks.json");
  if (!res.ok) {
    throw new Error(`picks.json の取得に失敗しました (${res.status})`);
  }
  const data = (await res.json()) as PicksData;
  // 収集データは外部由来。配列フィールドの欠落で描画/検索が落ちないよう正規化する。
  data.picks = (data.picks ?? []).map((p) => ({
    ...p,
    tags: Array.isArray(p.tags) ? p.tags : [],
    sources: Array.isArray(p.sources) ? p.sources : [],
    points: Array.isArray(p.points) ? p.points : [],
  }));
  return data;
}

/** ジャンル識別色（控えめに。雑誌的な落ち着いたトーン） */
export const GENRE_COLORS: Record<Genre, string> = {
  gadget: "#3E6B8A",
  housework: "#4E7C59",
  work: "#7A5C9E",
  health: "#B6452F",
  service: "#B98A2E",
};

export function genreColor(genre: string): string {
  return GENRE_COLORS[genre as Genre] ?? "#5C584F";
}

function mix(hex: string, toward: string, amt: number): string {
  const a = hex.replace("#", "");
  const b = toward.replace("#", "");
  const ch = (s: string, i: number) => parseInt(s.slice(i, i + 2), 16);
  const r = Math.round(ch(a, 0) + (ch(b, 0) - ch(a, 0)) * amt);
  const g = Math.round(ch(a, 2) + (ch(b, 2) - ch(a, 2)) * amt);
  const bl = Math.round(ch(a, 4) + (ch(b, 4) - ch(a, 4)) * amt);
  return "#" + [r, g, bl].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** ジャンル識別色から、ストーリーズ用の全面グラデを生成（ブランド色準拠） */
export function genreGradient(genre: string): string {
  const c = genreColor(genre);
  const top = mix(c, "#ffffff", 0.12);
  const bottom = mix(c, "#000000", 0.34);
  return `linear-gradient(160deg, ${top} 0%, ${bottom} 100%)`;
}

/** meta のジャンル名から短い見出し用ラベルを導く（"ガジェット・便利家電" → "ガジェット"）。ハードコードはしない。 */
export function shortLabel(fullLabel: string): string {
  return fullLabel.split("・")[0];
}

/** 今号ハイライト：信頼度3かつ新しい順の上位 n 件 */
export function topSignals(picks: Pick[], n = 3): Pick[] {
  return [...picks]
    .filter((p) => p.trust >= 3)
    .sort((a, b) => b.dateAdded.localeCompare(a.dateAdded))
    .slice(0, n);
}

/** "2026-06-24" → "2026.06.24" */
export function formatDateDot(iso: string): string {
  return iso.split("-").join(".");
}

/** "2026-06-24" → "06.24" */
export function formatDateShort(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${m}.${d}`;
}
