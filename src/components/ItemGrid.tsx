import { Fragment } from "react";
import { X, Heart, LayoutGrid, Rows3 } from "lucide-react";
import type { Pick, PicksMeta, Status } from "@/types";
import { effectiveStatus } from "@/lib/filtering";
import { formatDateShort, genreColor } from "@/lib/picks";
import { iconFor } from "@/lib/icons";
import { ItemCard } from "./ItemCard";
import { Stars } from "./Stars";
import { Yen } from "./Yen";

export type ViewMode = "card" | "list";

interface Props {
  picks: Pick[];
  total: number;
  meta: PicksMeta;
  favorites: Set<string>;
  statuses: Record<string, Status>;
  newIds: Set<string>;
  view: ViewMode;
  onSetView: (v: ViewMode) => void;
  /** 新着順のときのみ日付見出しを挿す */
  groupByDate: boolean;
  onToggleFavorite: (id: string) => void;
  onSetStatus: (id: string, status: Status | null) => void;
  onSelectTag: (tag: string) => void;
  onClearFilters: () => void;
}

/** picks を dateAdded ごとの [日付, 件数] 区切り情報つきで走査する */
function withDateSeps(picks: Pick[]): Array<{ pick: Pick; sep?: string }> {
  const counts = new Map<string, number>();
  for (const p of picks) counts.set(p.dateAdded, (counts.get(p.dateAdded) ?? 0) + 1);
  let prev = "";
  return picks.map((pick) => {
    if (pick.dateAdded !== prev) {
      prev = pick.dateAdded;
      const label = `${formatDateShort(pick.dateAdded)} · ${counts.get(pick.dateAdded)}点`;
      return { pick, sep: label };
    }
    return { pick };
  });
}

export function ItemGrid({
  picks,
  total,
  meta,
  favorites,
  statuses,
  newIds,
  view,
  onSetView,
  groupByDate,
  onToggleFavorite,
  onSetStatus,
  onSelectTag,
  onClearFilters,
}: Props) {
  const entries = groupByDate
    ? withDateSeps(picks)
    : picks.map((pick) => ({ pick, sep: undefined as string | undefined }));

  return (
    <div className="wrap">
      <div className="rubric">
        <span className="no">02</span>
        <h3 className="mincho">収録リスト</h3>
        <span className="rule" />
        <div className="view-toggle" role="group" aria-label="表示切替">
          <button
            type="button"
            className={"vbtn" + (view === "card" ? " on" : "")}
            aria-pressed={view === "card"}
            title="カード表示"
            onClick={() => onSetView("card")}
          >
            <LayoutGrid size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className={"vbtn" + (view === "list" ? " on" : "")}
            aria-pressed={view === "list"}
            title="リスト表示"
            onClick={() => onSetView("list")}
          >
            <Rows3 size={14} strokeWidth={1.8} />
          </button>
        </div>
        <span className="c">
          {picks.length === total
            ? `全 ${total} 点`
            : `${picks.length} / ${total} 点`}
        </span>
      </div>

      {picks.length === 0 ? (
        <div className="center-note empty">
          <p>条件に合うアイテムが見つかりませんでした。</p>
          <button type="button" className="clear-link" onClick={onClearFilters}>
            <X size={14} /> 絞り込みをクリア
          </button>
        </div>
      ) : view === "list" ? (
        <div className="rows">
          {entries.map(({ pick: p, sep }) => {
            const Icon = iconFor(p);
            return (
              <Fragment key={p.id}>
                {sep ? <div className="dsep num">{sep}</div> : null}
                <div
                  className="rowitem"
                  style={{ ["--gc" as string]: genreColor(p.genre) }}
                >
                  <span className="iplate iplate-sm" aria-hidden="true">
                    <Icon size={15} strokeWidth={1.6} />
                  </span>
                  <span className="rname mincho" title={p.blurb}>
                    {p.name}
                    {newIds.has(p.id) ? <span className="newb">NEW</span> : null}
                  </span>
                  <Stars value={p.trust} />
                  <Yen tier={p.priceTier} />
                  <button
                    className={"heart" + (favorites.has(p.id) ? " on" : "")}
                    type="button"
                    aria-pressed={favorites.has(p.id)}
                    aria-label={
                      favorites.has(p.id)
                        ? "お気に入りから外す"
                        : "お気に入りに追加"
                    }
                    onClick={() => onToggleFavorite(p.id)}
                  >
                    <Heart
                      size={15}
                      strokeWidth={1.8}
                      fill={favorites.has(p.id) ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </Fragment>
            );
          })}
        </div>
      ) : (
        <div className="grid">
          {entries.map(({ pick: p, sep }) => (
            <Fragment key={p.id}>
              {sep ? <div className="dsep num">{sep}</div> : null}
              <ItemCard
                pick={p}
                meta={meta}
                isFavorite={favorites.has(p.id)}
                status={effectiveStatus(p, statuses)}
                isNew={newIds.has(p.id)}
                onToggleFavorite={onToggleFavorite}
                onSetStatus={onSetStatus}
                onSelectTag={onSelectTag}
              />
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
