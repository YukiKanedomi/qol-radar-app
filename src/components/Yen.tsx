/** 価格帯を ¥ で表示（満たない分は淡色） */
export function Yen({ tier, max = 3 }: { tier: number; max?: number }) {
  const on = Math.max(0, Math.min(max, tier));
  return (
    <span className="yen" aria-label={`価格帯 ${on} / ${max}`}>
      {"¥".repeat(on)}
      {on < max ? <span className="off">{"¥".repeat(max - on)}</span> : null}
    </span>
  );
}
