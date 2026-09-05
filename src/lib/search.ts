/**
 * 日本語向けの検索正規化。
 * 全角/半角・大文字小文字・カタカナ/ひらがなの差を吸収し、空白区切りは AND 検索にする。
 * 「Anker」「ＡＮＫＥＲ」、「イヤホン」「いやほん」が同じ語として当たる。
 */
export function normalizeText(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    // カタカナ → ひらがな（U+30A1..U+30F6 → U+3041..U+3096）
    .replace(/[ァ-ヶ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60))
    // 長音・中黒・ハイフン類は表記ゆれの主因なので落とす
    .replace(/[ー・\-‐‑–—]/g, "");
}

/** 検索語を AND 条件の配列に（空文字なら空配列） */
export function queryTerms(query: string): string[] {
  return query
    .split(/[\s　]+/)
    .map((t) => normalizeText(t))
    .filter((t) => t.length > 0);
}

export function matchesTerms(haystack: string, terms: string[]): boolean {
  if (terms.length === 0) return true;
  const h = normalizeText(haystack);
  return terms.every((t) => h.includes(t));
}
