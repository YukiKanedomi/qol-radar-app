import { useState } from "react";
import { Heart, ChevronDown, Share2, ExternalLink } from "lucide-react";
import type { Pick, PicksMeta, Status } from "@/types";
import { genreColor, shortLabel } from "@/lib/picks";
import { iconFor } from "@/lib/icons";
import { itemUrl } from "@/lib/urlState";
import { toast } from "@/lib/toast";
import { keepAscii } from "@/lib/text";
import { Trust } from "./Trust";
import { Yen } from "./Yen";

interface Props {
  pick: Pick;
  meta: PicksMeta;
  isFavorite: boolean;
  status: Status;
  isNew: boolean;
  /** ディープリンク等で最初から開いておく */
  initialOpen?: boolean;
  onToggleFavorite: (id: string) => void;
  onSetStatus: (id: string, status: Status | null) => void;
  onSelectTag: (tag: string) => void;
}

/** カードで切替できるステータス（new は「未設定」扱いなので除外） */
const ACTION_STATUSES: Status[] = ["interested", "bought", "skip"];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

async function share(pick: Pick) {
  const url = itemUrl(pick.id);
  const data = { title: pick.name, text: pick.blurb, url };
  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(data))) {
      await navigator.share(data);
      return;
    }
  } catch (e) {
    // ユーザーが共有シートを閉じただけなら何もしない
    if ((e as { name?: string }).name === "AbortError") return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast("リンクをコピーしました");
  } catch {
    toast("コピーできませんでした。URL: " + url, { duration: 6000 });
  }
}

export function ItemCard({
  pick,
  meta,
  isFavorite,
  status,
  isNew,
  initialOpen = false,
  onToggleFavorite,
  onSetStatus,
  onSelectTag,
}: Props) {
  // 既定は圧縮表示。推しポイント・タグ・出典・ステータス操作はタップで開く
  const [open, setOpen] = useState(initialOpen);
  const sources = pick.sources ?? [];
  const Icon = iconFor(pick);
  const hasStatus = ACTION_STATUSES.includes(status);

  const changeStatus = (s: Status) => {
    const prev = status;
    const next = status === s ? null : s;
    onSetStatus(pick.id, next);
    const undo = {
      label: "元に戻す",
      onClick: () => onSetStatus(pick.id, ACTION_STATUSES.includes(prev) ? prev : null),
    };
    if (next) toast(`「${meta.statusLegend[next]}」に登録しました`, { action: undo });
    else toast(`「${meta.statusLegend[prev]}」を解除しました`, { action: undo });
  };

  return (
    <article
      id={"pick-" + pick.id}
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
        <h4 className="mincho">{keepAscii(pick.name)}</h4>
        <p className="blurb">{pick.blurb}</p>
      </div>

      {open ? (
        <div className="detail">
          {pick.points && pick.points.length > 0 ? (
            <ul className="points">
              {pick.points.map((pt, i) => (
                <li key={i}>{pt}</li>
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

          {sources.length > 0 ? (
            <ul className="sources" aria-label="出典">
              {sources.map((s) => (
                <li key={s}>
                  <a href={s} target="_blank" rel="noreferrer">
                    <ExternalLink size={11} strokeWidth={2} />
                    {hostOf(s)}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      <div className="cmeta">
        <Yen tier={pick.priceTier} legend={meta.priceLegend[String(pick.priceTier)]} />
        <Trust value={pick.trust} legend={meta.trustLegend[String(pick.trust)]} />
        {!open && hasStatus ? (
          <span className="stbadge">{meta.statusLegend[status]}</span>
        ) : null}
        {open ? (
          <button
            type="button"
            className="share"
            aria-label="このアイテムを共有"
            title="共有"
            onClick={() => void share(pick)}
          >
            <Share2 size={14} strokeWidth={1.8} />
          </button>
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
              onClick={() => changeStatus(s)}
            >
              {meta.statusLegend[s]}
            </button>
          ))}
        </div>
      ) : null}
    </article>
  );
}
