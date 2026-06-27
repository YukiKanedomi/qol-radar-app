import type { PicksMeta } from "@/types";
import { formatDateShort } from "@/lib/picks";

/** 月から季節ラベル（“号”名に使う・固定のVol番号は使わない） */
function seasonLabel(month: number): string {
  if (month === 12 || month <= 2) return "冬";
  if (month <= 4) return "春";
  if (month <= 6) return "初夏";
  if (month <= 8) return "夏";
  if (month <= 10) return "秋";
  return "晩秋";
}

export function Masthead({ meta }: { meta: PicksMeta }) {
  const [y, m] = meta.lastUpdated.split("-");
  const issue = `${y} ${seasonLabel(Number(m))}号`;

  return (
    <div className="mast">
      <div className="wrap mast-in">
        <div>
          <div className="vol">
            {issue} · 更新 {formatDateShort(meta.lastUpdated)}
          </div>
          <h2 className="mincho">
            暮らしの質を上げる、
            <br />
            <em>選び抜いた良品</em>の控え。
          </h2>
        </div>
        <p className="lead">
          買ってよかった・時短・効率化の声を編み、信頼できるものだけを記録する定点観測。
        </p>
      </div>
    </div>
  );
}
