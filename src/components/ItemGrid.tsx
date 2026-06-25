import { X } from "lucide-react";
import type { Pick, PicksMeta, Status } from "@/types";
import { effectiveStatus } from "@/lib/filtering";
import { ItemCard } from "./ItemCard";

interface Props {
  picks: Pick[];
  total: number;
  meta: PicksMeta;
  favorites: Set<string>;
  statuses: Record<string, Status>;
  onToggleFavorite: (id: string) => void;
  onSetStatus: (id: string, status: Status | null) => void;
  onSelectTag: (tag: string) => void;
  onClearFilters: () => void;
}

export function ItemGrid({
  picks,
  total,
  meta,
  favorites,
  statuses,
  onToggleFavorite,
  onSetStatus,
  onSelectTag,
  onClearFilters,
}: Props) {
  return (
    <div className="wrap">
      <div className="rubric">
        <span className="no">02</span>
        <h3 className="mincho">収録リスト</h3>
        <span className="rule" />
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
      ) : (
        <div className="grid">
          {picks.map((p) => (
            <ItemCard
              key={p.id}
              pick={p}
              meta={meta}
              isFavorite={favorites.has(p.id)}
              status={effectiveStatus(p, statuses)}
              onToggleFavorite={onToggleFavorite}
              onSetStatus={onSetStatus}
              onSelectTag={onSelectTag}
            />
          ))}
        </div>
      )}
    </div>
  );
}
