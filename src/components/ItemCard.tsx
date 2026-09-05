import { useState } from "react";
import { Heart, ChevronDown } from "lucide-react";
import type { Pick, PicksMeta, Status } from "@/types";
import { genreColor, shortLabel } from "@/lib/picks";
import { iconFor } from "@/lib/icons";
import { Trust } from "./Trust";
import { Yen } from "./Yen";

interface Props {
  pick: Pick;
  meta: PicksMeta;
  isFavorite: boolean;
  status: Status;
  isNew: boolean;
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
  isNew,
  onToggleFavorite,
  onSetStatus,
  onSelectTag,
}: Props) {
  // 既定は圧縮表示。推しポイント・タグ・出典・ステータス操作はタップで開く
  const [open, setOpen] = useState(false);
  const sources = pick.sources ?? [];
  const Icon = iconFor(pick);
  const hasStatus = ACTION_STATUSES.includes(status);

  return (
    <article
      className={"card" + (open ? " open" : "")}
      style={{ ["--gc" as string]: genreColor(pick.genre) }}
    >
      <div className="top">
        <span className="iplate" aria-hidden="true">
          <Icon size={17} strokeWidth={1.6} />
        </span>
        <span className="gtag" title={meta.genres[pick.genre]}>
          {shortLabel(meta.genres[pick.genre])}
        </span>
        {isNew ? <span className="newb">NEW</span> : null}
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

      <div className="card-body" onClick={() => setOpen((v) => !v)}>
        <h4 className="mincho">{pick.name}</h4>
        <p className="blurb">{pick.blurb}</p>
      </div>

      {open ? (
        <>
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
        </>
      ) : null}

      <div className="cmeta">
        <Yen tier={pick.priceTier} legend={meta.priceLegend[String(pick.priceTier)]} />
        <Trust value={pick.trust} legend={meta.trustLegend[String(pick.trust)]} />
        {!open && hasStatus ? (
          <span className="stbadge">{meta.statusLegend[status]}</span>
        ) : null}
        {open && sources.length > 0 ? (
          <a className="src" href={sources[0]} target="_blank" rel="noreferrer">
            ソース {sources.length} 件
          </a>
        ) : null}
        <button
          type="button"
          className="more"
          aria-expanded={open}
          aria-label={open ? "詳細を閉じる" : "詳細を開く"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "閉じる" : "詳しく"}
          <ChevronDown size={13} strokeWidth={2} />
        </button>
      </div>

      {open ? (
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
      ) : null}
    </article>
  );
}
