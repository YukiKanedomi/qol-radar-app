import type { Pick, PicksMeta } from "@/types";
import { genreColor, formatDateShort, shortLabel } from "@/lib/picks";
import { Yen } from "./Yen";
import { keepAscii } from "@/lib/text";

export function FeatureRow({
  items,
  meta,
  onSelect,
}: {
  items: Pick[];
  meta: PicksMeta;
  /** カードを選んだら、収録リスト側でその1件を開いて見せる */
  onSelect: (id: string) => void;
}) {
  return (
    <div className="wrap">
      <div className="rubric">
        <span className="no">01</span>
        <h3 className="mincho">今号の注目</h3>
        <span className="rule" />
        <span className="c">信頼度 ★★★ ／ 最新</span>
      </div>
      <div className="feat">
        {items.map((p) => (
          <article
            className="f"
            key={p.id}
            style={{ ["--gc" as string]: genreColor(p.genre) }}
            role="button"
            tabIndex={0}
            aria-label={`${p.name} の詳細を見る`}
            onClick={() => onSelect(p.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(p.id);
              }
            }}
          >
            <div className="kicker" title={meta.genres[p.genre]}>
              {shortLabel(meta.genres[p.genre])}
            </div>
            <h4 className="mincho">{keepAscii(p.name)}</h4>
            <p className="blurb">{p.blurb}</p>
            <div className="fm">
              <Yen tier={p.priceTier} legend={meta.priceLegend[String(p.priceTier)]} />
              <span className="datem num">{formatDateShort(p.dateAdded)}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
