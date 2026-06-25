import type { PicksMeta } from "@/types";
import { formatDateDot } from "@/lib/picks";
import type { Theme } from "@/lib/theme";
import { ThemeToggle } from "./ThemeToggle";

export function SiteHeader({
  meta,
  count,
  theme,
  onToggleTheme,
}: {
  meta: PicksMeta;
  count: number;
  theme: Theme;
  onToggleTheme: () => void;
}) {
  return (
    <header className="site-header">
      <div className="hbar">
        <div className="brand">
          <span className="mark">📡</span>
          <h1>{meta.title}</h1>
          <span className="en">Quality Goods Index</span>
        </div>
        <div className="hmeta">
          <span>
            収録 <b className="num">{count}</b> 点
          </span>
          <span className="sep-hide">
            更新 <b className="num">{formatDateDot(meta.lastUpdated)}</b>
          </span>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
