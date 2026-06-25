import { Heart } from "lucide-react";
import type { Pick, PicksMeta, Status } from "@/types";
import { genreColor, shortLabel } from "@/lib/picks";
import { Stars } from "./Stars";
import { Yen } from "./Yen";

interface Props {
  pick: Pick;
  meta: PicksMeta;
  isFavorite: boolean;
  status: Status;
  onToggleFavorite: (id: string) => void;
  onSetStatus: (id: string, status: Status | null) => void;
  onSelectTag: (tag: string) => void;
}

/** カードで切替できるステータス（new は「未設定」扱いなので除外） */
const ACTION_STATUSES: Status[] = ["interested", "bought", "skip"];

export function ItemCard({
  pick,
  meta,
  isFavorite,
  status,
  onToggleFavorite,
  onSetStatus,
  onSelectTag,
}: Props) {
  const sources = pick.sources ?? [];

  return (
    <article className="card" style={{ ["--gc" as string]: genreColor(pick.genre) }}>
      <div className="top">
        <span className="gtag" title={meta.genres[pick.genre]}>
          {shortLabel(meta.genres[pick.genre])}
        </span>
        <button
          className={"heart" + (isFavorite ? " on" : "")}
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? "お気に入りから外す" : "お気に入りに追加"}
          onClick={() => onToggleFavorite(pick.id)}
        >
          <Heart size={16} strokeWidth={1.8} fill={isFavorite ? "currentColor" : "none"} />
        </button>
      </div>

      <h4 className="mincho">{pick.name}</h4>
      <p className="blurb">{pick.blurb}</p>

      {pick.points && pick.points.length > 0 ? (
        <ul className="points">
          {pick.points.map((pt) => (
            <li key={pt}>{pt}</li>
          ))}
        </ul>
      ) : null}

      <div className="tags">
        {pick.tags.map((t) => (
          <button
            className="tag"
            key={t}
            type="button"
            title={`「${t}」で絞り込み`}
            onClick={() => onSelectTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="cmeta">
        <Stars value={pick.trust} />
        <Yen tier={pick.priceTier} />
        {sources.length > 0 ? (
          <a className="src" href={sources[0]} target="_blank" rel="noreferrer">
            ソース {sources.length} 件
          </a>
        ) : null}
      </div>

      <div className="status-row">
        {ACTION_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            className={"seg seg-sm" + (status === s ? " on" : "")}
            aria-pressed={status === s}
            // すでにその状態なら解除（元に戻す）、違えばその状態にする
            onClick={() => onSetStatus(pick.id, status === s ? null : s)}
          >
            {meta.statusLegend[s]}
          </button>
        ))}
      </div>
    </article>
  );
}
