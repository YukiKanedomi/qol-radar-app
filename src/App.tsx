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
import { ItemGrid } from "@/components/ItemGrid";

export default function App() {
  const [data, setData] = useState<PicksData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [digestOpen, setDigestOpen] = useState(false);

  const { favorites, statuses, toggleFavorite, setStatus, sync } =
    useCollection();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadPicks()
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "読み込みに失敗しました"),
      );
  }, []);

  const patch = (p: Partial<FilterState>) =>
    setFilters((s) => ({ ...s, ...p }));

  const picks = data?.picks ?? [];
  const visible = useMemo(
    () => applyFilters(picks, filters, statuses, favorites),
    [picks, filters, statuses, favorites],
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
      <Masthead />
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
        />
        <ItemGrid
          picks={visible}
          total={picks.length}
          meta={meta}
          favorites={favorites}
          statuses={statuses}
          onToggleFavorite={toggleFavorite}
          onSetStatus={setStatus}
          onSelectTag={(t) => patch({ query: t })}
          onClearFilters={() => setFilters(defaultFilterState)}
        />
      </main>
      <StoriesDigest
        picks={picks}
        meta={meta}
        open={digestOpen}
        onClose={() => setDigestOpen(false)}
      />
    </>
  );
}
