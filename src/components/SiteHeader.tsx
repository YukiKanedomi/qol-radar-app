import { Heart, Sparkles } from "lucide-react";
import type { PicksMeta } from "@/types";
import { formatDateDot } from "@/lib/picks";
import type { Theme } from "@/lib/theme";
import type { SyncStatus } from "@/lib/useCollection";
import { ThemeToggle } from "./ThemeToggle";
import { SyncToggle } from "./SyncToggle";

interface SyncProps {
  configured: boolean;
  on: boolean;
  status: SyncStatus;
  toggle: () => void;
  retry: () => void;
}

export function SiteHeader({
  meta,
  count,
  theme,
  onToggleTheme,
  favoritesOnly,
  onToggleFavoritesOnly,
  sync,
  onOpenDigest,
}: {
  meta: PicksMeta;
  count: number;
  theme: Theme;
  onToggleTheme: () => void;
  favoritesOnly: boolean;
  onToggleFavoritesOnly: () => void;
  sync: SyncProps;
  onOpenDigest: () => void;
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
          <button
            type="button"
            className="digest-cta"
            onClick={onOpenDigest}
            aria-label="今週のダイジェストを見る"
          >
            <Sparkles size={14} strokeWidth={2} />
            <span className="digest-cta-label">ダイジェスト</span>
          </button>
          <span className="header-count">
            収録 <b className="num">{count}</b> 点
          </span>
          <span className="sep-hide">
            更新 <b className="num">{formatDateDot(meta.lastUpdated)}</b>
          </span>
          {sync.configured ? (
            <SyncToggle
              status={sync.status}
              on={sync.on}
              onToggle={sync.toggle}
              onRetry={sync.retry}
            />
          ) : null}
          <button
            type="button"
            className={"theme-toggle" + (favoritesOnly ? " on" : "")}
            onClick={onToggleFavoritesOnly}
            aria-pressed={favoritesOnly}
            aria-label={favoritesOnly ? "すべて表示" : "お気に入りのみ表示"}
            title={favoritesOnly ? "すべて表示" : "お気に入りのみ"}
          >
            <Heart
              size={16}
              strokeWidth={1.8}
              fill={favoritesOnly ? "currentColor" : "none"}
            />
          </button>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </div>
    </header>
  );
}
