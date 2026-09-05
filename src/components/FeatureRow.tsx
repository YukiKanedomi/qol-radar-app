import type { Pick, PicksMeta } from "@/types";
import { genreColor, formatDateShort, shortLabel } from "@/lib/picks";
import { Yen } from "./Yen";

export function FeatureRow({ items, meta }: { items: Pick[]; meta: PicksMeta }) {
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
          >
            <div className="kicker" title={meta.genres[p.genre]}>
              {shortLabel(meta.genres[p.genre])}
            </div>
            <h4 className="mincho">{p.name}</h4>
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
