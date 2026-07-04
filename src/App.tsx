import { useEffect, useMemo, useState } from "react";
import { Sparkles, ChevronRight } from "lucide-react";
import type { PicksData } from "@/types";
import { loadPicks, topSignals } from "@/lib/picks";
import {
  applyFilters,
  defaultFilterState,
  type FilterState,
} from "@/lib/filtering";
import { useCollection } from "@/lib/useCollection";
import { useTheme } from "@/lib/theme";
import { SiteHeader } from "@/components/SiteHeader";
import { StoriesDigest } from "@/components/StoriesDigest";
import { Masthead } from "@/components/Masthead";
import { FeatureRow } from "@/components/FeatureRow";
import { FilterBar } from "@/components/FilterBar";
import { ItemGrid, type ViewMode } from "@/components/ItemGrid";
import { BackToTop } from "@/components/BackToTop";

/** 前回訪問時点の最新 dateAdded（これより後の追加を NEW 扱いにする） */
const SEEN_KEY = "qol-radar.lastSeenDate";
const VIEW_KEY = "qol-radar.view";

export default function App() {
  const [data, setData] = useState<PicksData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [digestOpen, setDigestOpen] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>(() =>
    localStorage.getItem(VIEW_KEY) === "list" ? "list" : "card",
  );

  const { favorites, statuses, toggleFavorite, setStatus, sync } =
    useCollection();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadPicks()
      .then((d) => {
        setData(d);
        // 前回訪問より後に追加された分を NEW としてマーク（今セッション中は維持）
        const max = d.picks.reduce(
          (m, p) => (p.dateAdded > m ? p.dateAdded : m),
          "",
        );
        const prev = localStorage.getItem(SEEN_KEY);
        if (prev && prev < max) {
          setNewIds(new Set(d.picks.filter((p) => p.dateAdded > prev).map((p) => p.id)));
        }
        if (max) localStorage.setItem(SEEN_KEY, max);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "読み込みに失敗しました"),
      );
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    localStorage.setItem(VIEW_KEY, v);
  };

  const patch = (p: Partial<FilterState>) =>
    setFilters((s) => ({ ...s, ...p }));

  const picks = data?.picks ?? [];
  const visible = useMemo(
    () => applyFilters(picks, filters, statuses, favorites, newIds),
    [picks, filters, statuses, favorites, newIds],
  );
  const highlights = useMemo(() => topSignals(picks, 3), [picks]);

  if (error) {
    return <div className="center-note">{error}</div>;
  }
  if (!data) {
    return <div className="center-note">読み込み中…</div>;
  }

  const { meta } = data;

  return (
    <>
      <SiteHeader
        meta={meta}
        count={picks.length}
        theme={theme}
        onToggleTheme={toggleTheme}
        favoritesOnly={filters.favoritesOnly}
        onToggleFavoritesOnly={() =>
          patch({ favoritesOnly: !filters.favoritesOnly })
        }
        sync={sync}
        onOpenDigest={() => setDigestOpen(true)}
      />
      <Masthead meta={meta} />
      <div className="wrap">
        <button
          type="button"
          className="digest-banner"
          onClick={() => setDigestOpen(true)}
        >
          <span className="digest-banner-ic">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <span className="digest-banner-txt">
            <b>今週のダイジェスト</b>
            <span>注目の良品を全画面スワイプで振り返る</span>
          </span>
          <ChevronRight size={20} strokeWidth={2} className="digest-banner-arrow" />
        </button>
      </div>
      <main>
        {highlights.length > 0 ? (
          <FeatureRow items={highlights} meta={meta} />
        ) : null}
        <FilterBar
          meta={meta}
          state={filters}
          patch={patch}
          resultCount={visible.length}
          newCount={newIds.size}
        />
        <ItemGrid
          picks={visible}
          total={picks.length}
          meta={meta}
          favorites={favorites}
          statuses={statuses}
          newIds={newIds}
          view={view}
          onSetView={setViewPersist}
          groupByDate={filters.sort === "newest"}
          onToggleFavorite={toggleFavorite}
          onSetStatus={setStatus}
          onSelectTag={(t) => patch({ query: t })}
          onClearFilters={() => setFilters(defaultFilterState)}
        />
      </main>
      <BackToTop />
      <StoriesDigest
        picks={picks}
        meta={meta}
        open={digestOpen}
        onClose={() => setDigestOpen(false)}
      />
    </>
  );
}
