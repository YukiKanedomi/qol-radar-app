import { Fragment, useEffect, useState } from "react";
import { X, Heart, LayoutGrid, Rows3 } from "lucide-react";
import type { Pick, PicksMeta, Status } from "@/types";
import { effectiveStatus } from "@/lib/filtering";
import { formatDateShort, genreColor } from "@/lib/picks";
import { iconFor } from "@/lib/icons";
import { ItemCard } from "./ItemCard";
import { Trust } from "./Trust";
import { Yen } from "./Yen";
import { keepAscii } from "@/lib/text";

export type ViewMode = "card" | "list";

/** 一度に描く件数。359件を一気に描くとスマホで初回描画とスクロールが重くなる */
const PAGE = 30;

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
  /** ディープリンクで開いておく1件 */
  openId: string | null;
  /** 絞り込み条件の署名。変わったら1ページ目に戻す */
  filterKey: string;
  onToggleFavorite: (id: string) => void;
  onSetStatus: (id: string, status: Status | null) => void;
  onSelectTag: (tag: string) => void;
  onClearFilters: () => void;
}

/** picks を dateAdded ごとの [日付, 件数] 区切り情報つきで走査する */
function withDateSeps(picks: Pick[], all: Pick[]): Array<{ pick: Pick; sep?: string }> {
  const counts = new Map<string, number>();
  for (const p of all) counts.set(p.dateAdded, (counts.get(p.dateAdded) ?? 0) + 1);
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
  openId,
  filterKey,
  onToggleFavorite,
  onSetStatus,
  onSelectTag,
  onClearFilters,
}: Props) {
  const [limit, setLimit] = useState(PAGE);
  // リスト表示で開いている1件（行の下にカード詳細を差し込む）
  const [openRow, setOpenRow] = useState<string | null>(openId);
  useEffect(() => {
    if (openId) setOpenRow(openId);
  }, [openId]);
  // 絞り込み条件が変わったら1ページ目に戻す（♡やステータスの変更では戻さない）
  useEffect(() => setLimit(PAGE), [filterKey]);

  // ディープリンクの対象が後ろのページにいる場合は、そこまで開いておく
  const openIndex = openId ? picks.findIndex((p) => p.id === openId) : -1;
  useEffect(() => {
    if (openIndex >= 0) {
      setLimit((l) => (openIndex >= l ? Math.ceil((openIndex + 1) / PAGE) * PAGE : l));
    }
  }, [openIndex]);

  const shown = picks.slice(0, limit);
  const remaining = picks.length - shown.length;
  const entries = groupByDate
    ? withDateSeps(shown, picks)
    : shown.map((pick) => ({ pick, sep: undefined as string | undefined }));

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
            aria-label="カード表示"
            onClick={() => onSetView("card")}
          >
            <LayoutGrid size={14} strokeWidth={1.8} />
          </button>
          <button
            type="button"
            className={"vbtn" + (view === "list" ? " on" : "")}
            aria-pressed={view === "list"}
            title="リスト表示"
            aria-label="リスト表示"
            onClick={() => onSetView("list")}
          >
            <Rows3 size={14} strokeWidth={1.8} />
          </button>
        </div>
        <span className="c num">
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
                  <button
                    type="button"
                    className="rname mincho"
                    aria-expanded={openRow === p.id}
                    onClick={() => setOpenRow((cur) => (cur === p.id ? null : p.id))}
                  >
                    <span>{keepAscii(p.name)}</span>
                    {newIds.has(p.id) ? <span className="newb">NEW</span> : null}
                  </button>
                  <Yen tier={p.priceTier} legend={meta.priceLegend[String(p.priceTier)]} />
                  <Trust value={p.trust} legend={meta.trustLegend[String(p.trust)]} />
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
                {openRow === p.id ? (
                  <div className="row-detail">
                    <ItemCard
                      pick={p}
                      meta={meta}
                      isFavorite={favorites.has(p.id)}
                      status={effectiveStatus(p, statuses)}
                      isNew={newIds.has(p.id)}
                      initialOpen
                      onToggleFavorite={onToggleFavorite}
                      onSetStatus={onSetStatus}
                      onSelectTag={onSelectTag}
                    />
                  </div>
                ) : null}
              </Fragment>
            );
          })}
        </div>
      ) : (
        <div className="grid">
          {entries.map(({ pick: p, sep }) => (
            <Fragment key={p.id}>
              {sep ? <div className="dsep num">{sep}</div> : null}
              {/* 指名された1件は key を変えて再マウントし、開いた状態で描く */}
              <ItemCard
                key={p.id === openId ? p.id + ":open" : p.id}
                pick={p}
                meta={meta}
                isFavorite={favorites.has(p.id)}
                status={effectiveStatus(p, statuses)}
                isNew={newIds.has(p.id)}
                initialOpen={p.id === openId}
                onToggleFavorite={onToggleFavorite}
                onSetStatus={onSetStatus}
                onSelectTag={onSelectTag}
              />
            </Fragment>
          ))}
        </div>
      )}

      {remaining > 0 ? (
        <div className="more-row">
          <button
            type="button"
            className="load-more"
            onClick={() => setLimit((l) => l + PAGE)}
          >
            さらに表示 <span className="num">（残り {remaining} 点）</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
