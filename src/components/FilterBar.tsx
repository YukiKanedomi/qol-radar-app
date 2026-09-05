import { useState } from "react";
import { Search, Heart, SlidersHorizontal, ChevronDown, X } from "lucide-react";
import type { PicksMeta, Status } from "@/types";
import { shortLabel } from "@/lib/picks";
import type { FilterState, SortKey } from "@/lib/filtering";

interface Props {
  meta: PicksMeta;
  state: FilterState;
  patch: (p: Partial<FilterState>) => void;
  onReset: () => void;
  resultCount: number;
  /** 前回訪問以降の新着数（0なら新着トグル非表示） */
  newCount: number;
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

/** 二次フィルターの適用数（モバイルの「絞り込み」バッジ用） */
function activeRefineCount(s: FilterState): number {
  return (
    (s.minTrust > 0 ? 1 : 0) +
    (s.prices.length > 0 ? 1 : 0) +
    (s.statuses.length > 0 ? 1 : 0) +
    (s.favoritesOnly ? 1 : 0) +
    (s.newOnly ? 1 : 0)
  );
}

interface ActiveChip {
  key: string;
  label: string;
  clear: Partial<FilterState>;
}

/** 適用中の条件を「何で絞っているか」1行に。閉じた絞り込みパネルの中身が見えない問題への答え */
function activeChips(s: FilterState, meta: PicksMeta): ActiveChip[] {
  const chips: ActiveChip[] = [];
  if (s.genre !== "all")
    chips.push({ key: "g", label: shortLabel(meta.genres[s.genre] ?? s.genre), clear: { genre: "all" } });
  if (s.minTrust > 0)
    chips.push({ key: "t", label: s.minTrust === 3 ? "★3" : `★${s.minTrust}+`, clear: { minTrust: 0 } });
  if (s.prices.length > 0)
    chips.push({
      key: "p",
      label: [...s.prices].sort().map((t) => "¥".repeat(t)).join(" / "),
      clear: { prices: [] },
    });
  if (s.statuses.length > 0)
    chips.push({
      key: "s",
      label: s.statuses.map((k) => meta.statusLegend[k]).join(" / "),
      clear: { statuses: [] },
    });
  if (s.favoritesOnly) chips.push({ key: "fav", label: "お気に入り", clear: { favoritesOnly: false } });
  if (s.newOnly) chips.push({ key: "new", label: "新着のみ", clear: { newOnly: false } });
  if (s.query.trim()) chips.push({ key: "q", label: `“${s.query.trim()}”`, clear: { query: "" } });
  return chips;
}

export function FilterBar({ meta, state, patch, onReset, resultCount, newCount }: Props) {
  const [open, setOpen] = useState(false);
  const genres = Object.keys(meta.genres);
  const prices = Object.keys(meta.priceLegend).map(Number).sort();
  const statusKeys = Object.keys(meta.statusLegend) as Status[];
  const refineCount = activeRefineCount(state);
  const chips = activeChips(state, meta);

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
    <div className="filters" role="search" aria-label="絞り込みと検索">
      <span className="sr-only" aria-live="polite">
        該当 {resultCount} 件
      </span>
      <div className="wrap">
        {/* ジャンル + 検索 + （モバイル）絞り込みトグル */}
        <div className="filter-head">
          <div className="chips">
            <button
              className={"chip" + (state.genre === "all" ? " on" : "")}
              type="button"
              aria-pressed={state.genre === "all"}
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
                aria-pressed={state.genre === key}
                onClick={() => patch({ genre: key })}
              >
                {shortLabel(meta.genres[key])}
              </button>
            ))}
          </div>

          <div className="filter-actions">
            <label className="search">
              <Search size={14} strokeWidth={2} />
              <input
                className="search-input"
                type="search"
                value={state.query}
                placeholder="名称・タグで検索"
                aria-label="検索"
                enterKeyHint="search"
                autoComplete="off"
                onChange={(e) => patch({ query: e.target.value })}
              />
            </label>
            <button
              type="button"
              className="filter-toggle"
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <SlidersHorizontal size={14} strokeWidth={2} />
              絞り込み
              {refineCount > 0 ? (
                <span className="filter-badge num">{refineCount}</span>
              ) : null}
              <ChevronDown size={14} strokeWidth={2} className="chev" />
            </button>
          </div>
        </div>

        {/* 信頼度 / 価格 / 状態 / お気に入り / 並び替え（モバイルは折りたたみ） */}
        <div className={"refine" + (open ? " open" : "")}>
          <div className="fg" role="group" aria-label="信頼度">
            <span className="fg-label">信頼度</span>
            {TRUST_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                className={"seg" + (state.minTrust === o.value ? " on" : "")}
                aria-pressed={state.minTrust === o.value}
                onClick={() => patch({ minTrust: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>

          <div className="fg" role="group" aria-label="価格帯">
            <span className="fg-label">価格</span>
            {prices.map((tier) => (
              <button
                key={tier}
                type="button"
                title={meta.priceLegend[String(tier)]}
                aria-label={`価格帯 ${meta.priceLegend[String(tier)]}`}
                className={"seg" + (state.prices.includes(tier) ? " on" : "")}
                aria-pressed={state.prices.includes(tier)}
                onClick={() => togglePrice(tier)}
              >
                {"¥".repeat(tier)}
              </button>
            ))}
          </div>

          <div className="fg" role="group" aria-label="状態">
            <span className="fg-label">状態</span>
            {statusKeys.map((key) => (
              <button
                key={key}
                type="button"
                className={"seg" + (state.statuses.includes(key) ? " on" : "")}
                aria-pressed={state.statuses.includes(key)}
                onClick={() => toggleStatus(key)}
              >
                {meta.statusLegend[key]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={"seg fav-toggle" + (state.favoritesOnly ? " on" : "")}
            aria-pressed={state.favoritesOnly}
            onClick={() => patch({ favoritesOnly: !state.favoritesOnly })}
          >
            <Heart
              size={13}
              strokeWidth={2}
              fill={state.favoritesOnly ? "currentColor" : "none"}
            />
            お気に入り
          </button>

          {newCount > 0 ? (
            <button
              type="button"
              className={"seg new-toggle" + (state.newOnly ? " on" : "")}
              aria-pressed={state.newOnly}
              title="前回見たあとに追加されたアイテム"
              onClick={() => patch({ newOnly: !state.newOnly })}
            >
              新着 <span className="num">{newCount}</span>
            </button>
          ) : null}

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

        {/* 適用中の条件（1つでもあれば表示）。個別に外す／すべて解除 */}
        {chips.length > 0 ? (
          <div className="active-row">
            <span className="active-label">絞り込み中</span>
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className="achip"
                aria-label={`${c.label} を解除`}
                onClick={() => patch(c.clear)}
              >
                {c.label}
                <X size={11} strokeWidth={2.2} />
              </button>
            ))}
            <span className="active-tail">
              <span className="active-count num">{resultCount} 件</span>
              <button type="button" className="active-clear" onClick={onReset}>
                すべて解除
              </button>
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
