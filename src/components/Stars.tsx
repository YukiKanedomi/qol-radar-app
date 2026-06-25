/** 信頼度を★で表示（満たない分は淡色） */
export function Stars({ value, max = 3 }: { value: number; max?: number }) {
  const on = Math.max(0, Math.min(max, value));
  return (
    <span className="stars" aria-label={`信頼度 ${on} / ${max}`}>
      {"★".repeat(on)}
      {off(max - on)}
    </span>
  );
}

function off(n: number) {
  if (n <= 0) return null;
  return <span className="off">{"★".repeat(n)}</span>;
}
