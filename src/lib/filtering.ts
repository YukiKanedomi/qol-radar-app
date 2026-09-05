import type { Pick, Status } from "@/types";
import { matchesTerms, queryTerms } from "./search";

export type SortKey = "newest" | "trust" | "price";

export interface FilterState {
  /** ジャンルキー or "all" */
  genre: string;
  /** 信頼度の下限（0 = 指定なし） */
  minTrust: number;
  /** 価格帯の複数選択（空 = 指定なし） */
  prices: number[];
  /** ステータスの複数選択（空 = 指定なし） */
  statuses: Status[];
  /** お気に入りのみ表示 */
  favoritesOnly: boolean;
  /** 前回訪問以降の新着のみ表示 */
  newOnly: boolean;
  /** 検索語（name・blurb・tags が対象） */
  query: string;
  sort: SortKey;
}

export const defaultFilterState: FilterState = {
  genre: "all",
  minTrust: 0,
  prices: [],
  statuses: [],
  favoritesOnly: false,
  newOnly: false,
  query: "",
  sort: "newest",
};

/** ユーザー上書きを優先した実効ステータス */
export function effectiveStatus(
  pick: Pick,
  overrides: Record<string, Status>,
): Status {
  return overrides[pick.id] ?? pick.status;
}

export function applyFilters(
  picks: Pick[],
  state: FilterState,
  overrides: Record<string, Status>,
  favorites: Set<string>,
  newIds: Set<string>,
): Pick[] {
  const terms = queryTerms(state.query);

  const filtered = picks.filter((p) => {
    if (state.genre !== "all" && p.genre !== state.genre) return false;
    if (state.minTrust > 0 && p.trust < state.minTrust) return false;
    if (state.prices.length > 0 && !state.prices.includes(p.priceTier)) return false;
    if (
      state.statuses.length > 0 &&
      !state.statuses.includes(effectiveStatus(p, overrides))
    )
      return false;
    if (state.favoritesOnly && !favorites.has(p.id)) return false;
    if (state.newOnly && !newIds.has(p.id)) return false;
    if (terms.length > 0) {
      const hay = `${p.name} ${p.blurb} ${p.tags.join(" ")} ${(p.points ?? []).join(" ")}`;
      if (!matchesTerms(hay, terms)) return false;
    }
    return true;
  });

  return sortPicks(filtered, state.sort);
}

function sortPicks(picks: Pick[], sort: SortKey): Pick[] {
  const arr = [...picks];
  switch (sort) {
    case "trust":
      arr.sort(
        (a, b) => b.trust - a.trust || b.dateAdded.localeCompare(a.dateAdded),
      );
      break;
    case "price":
      arr.sort(
        (a, b) =>
          a.priceTier - b.priceTier || b.dateAdded.localeCompare(a.dateAdded),
      );
      break;
    case "newest":
    default:
      arr.sort(
        (a, b) =>
          b.dateAdded.localeCompare(a.dateAdded) || a.name.localeCompare(b.name),
      );
  }
  return arr;
}
