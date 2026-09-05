/**
 * 信頼度の表示。★3（大多数）は何も出さず、★2以下だけ凡例つきで示す。
 * 全カードに ★★★ が並ぶと情報にならないため、例外だけを見せる。
 */
export function Trust({ value, legend }: { value: number; legend?: string }) {
  if (value >= 3) return null;
  return (
    <span className="trust" aria-label={`信頼度 ${value} / 3`}>
      <span className="num">★{value}</span>
      {legend ? <span className="lbl">{legend}</span> : null}
    </span>
  );
}
