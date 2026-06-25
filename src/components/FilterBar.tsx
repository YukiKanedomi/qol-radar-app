import { Search, Heart } from "lucide-react";
import type { PicksMeta, Status } from "@/types";
import { shortLabel } from "@/lib/picks";
import type { FilterState, SortKey } from "@/lib/filtering";

interface Props {
  meta: PicksMeta;
  state: FilterState;
  patch: (p: Partial<FilterState>) => void;
  resultCount: number;
}

const TRUST_OPTS: { value: number; label: string }[] = [
  { value: 0, label: "全て" },
  { value: 1, label: "★1+" },
  { value: 2, label: "★2+" },
  { value: 3, label: "★3" },
];

const SORT_OPTS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "新着順" },
  { value: "trust", label: "信頼度順" },
  { value: "price", label: "価格安い順" },
];

export function FilterBar({ meta, state, patch, resultCount }: Props) {
  const genres = Object.keys(meta.genres);
  const prices = Object.keys(meta.priceLegend).map(Number).sort();
  const statusKeys = Object.keys(meta.statusLegend) as Status[];

  const togglePrice = (tier: number) =>
    patch({
      prices: state.prices.includes(tier)
        ? state.prices.filter((p) => p !== tier)
        : [...state.prices, tier],
    });

  const toggleStatus = (s: Status) =>
    patch({
      statuses: state.statuses.includes(s)
        ? state.statuses.filter((x) => x !== s)
        : [...state.statuses, s],
    });

  return (
    <div className="filters">
      <div className="wrap">
        {/* row 1: ジャンル + 検索 */}
        <div className="chips">
          <button
            className={"chip" + (state.genre === "all" ? " on" : "")}
            type="button"
            onClick={() => patch({ genre: "all" })}
          >
            全て
          </button>
          {genres.map((key) => (
            <button
              className={"chip" + (state.genre === key ? " on" : "")}
              type="button"
              key={key}
              title={meta.genres[key]}
              onClick={() => patch({ genre: key })}
            >
              {shortLabel(meta.genres[key])}
            </button>
          ))}
          <label className="search">
            <Search size={14} strokeWidth={2} />
            <input
              className="search-input"
              type="search"
              value={state.query}
              placeholder="名称・タグで検索"
              onChange={(e) => patch({ query: e.target.value })}
            />
          </label>
        </div>

        {/* row 2: 信頼度 / 価格 / 状態 / お気に入り / 並び替え */}
        <div className="refine">
          <div className="fg">
            <span className="fg-label">信頼度</span>
            {TRUST_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={"seg" + (state.minTrust === o.value ? " on" : "")}
                onClick={() => patch({ minTrust: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="fg">
            <span className="fg-label">価格</span>
            {prices.map((tier) => (
              <button
                key={tier}
                type="button"
                title={meta.priceLegend[String(tier)]}
                className={"seg" + (state.prices.includes(tier) ? " on" : "")}
                onClick={() => togglePrice(tier)}
              >
                {"¥".repeat(tier)}
              </button>
            ))}
          </div>

          <div className="fg">
            <span className="fg-label">状態</span>
            {statusKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={"seg" + (state.statuses.includes(key) ? " on" : "")}
                onClick={() => toggleStatus(key)}
              >
                {meta.statusLegend[key]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={"seg fav-toggle" + (state.favoritesOnly ? " on" : "")}
            onClick={() => patch({ favoritesOnly: !state.favoritesOnly })}
          >
            <Heart
              size={13}
              strokeWidth={2}
              fill={state.favoritesOnly ? "currentColor" : "none"}
            />
            お気に入り
          </button>

          <div className="refine-right">
            <span className="result-count num">{resultCount} 件</span>
            <label className="sortsel">
              <span className="fg-label">並び</span>
              <select
                value={state.sort}
                onChange={(e) => patch({ sort: e.target.value as SortKey })}
              >
                {SORT_OPTS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
