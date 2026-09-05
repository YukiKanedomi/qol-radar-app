/** 価格帯を ¥ の数＋凡例文字で表示（淡色の ¥ は判別できないため廃止） */
export function Yen({
  tier,
  legend,
  max = 3,
}: {
  tier: number;
  legend?: string;
  max?: number;
}) {
  const on = Math.max(1, Math.min(max, tier));
  return (
    <span className="yen" aria-label={`価格帯 ${legend ?? `${on} / ${max}`}`}>
      <b>{"¥".repeat(on)}</b>
      {legend ? <span className="lbl">{legend}</span> : null}
    </span>
  );
}
