import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { storageGet, storageSet } from "@/lib/storage";
import { onlyQueryDiffers, readUrl, writeUrl } from "@/lib/urlState";
import { toast } from "@/lib/toast";
import { SiteHeader } from "@/components/SiteHeader";
import { StoriesDigest } from "@/components/StoriesDigest";
import { Masthead } from "@/components/Masthead";
import { FeatureRow } from "@/components/FeatureRow";
import { FilterBar } from "@/components/FilterBar";
import { ItemGrid, type ViewMode } from "@/components/ItemGrid";
import { SiteFooter } from "@/components/SiteFooter";
import { BackToTop } from "@/components/BackToTop";
import { LoadingShell } from "@/components/LoadingShell";

/** 前回訪問時点の最新 dateAdded（これより後の追加を NEW 扱いにする） */
const SEEN_KEY = "qol-radar.lastSeenDate";
const VIEW_KEY = "qol-radar.view";

export default function App() {
  const initial = useRef(readUrl());
  const [data, setData] = useState<PicksData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [filters, setFilters] = useState<FilterState>(initial.current.filters);
  const [openId, setOpenId] = useState<string | null>(initial.current.item);
  const [digestOpen, setDigestOpen] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  // ディープリンクで1件を開くときはカード表示で（リスト表示には展開先が無い）
  const [view, setView] = useState<ViewMode>(() =>
    !initial.current.item && storageGet(VIEW_KEY) === "list" ? "list" : "card",
  );
  const latestDateRef = useRef("");

  const { favorites, statuses, toggleFavorite, setStatus, sync } =
    useCollection();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    setError(null);
    loadPicks()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        // 前回訪問より後に追加された分を NEW としてマーク
        const max = d.picks.reduce(
          (m, p) => (p.dateAdded > m ? p.dateAdded : m),
          "",
        );
        latestDateRef.current = max;
        const prev = storageGet(SEEN_KEY);
        if (prev && prev < max) {
          setNewIds(new Set(d.picks.filter((p) => p.dateAdded > prev).map((p) => p.id)));
        }
        if (!prev && max) storageSet(SEEN_KEY, max);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  // 「見た」の確定は画面を離れるとき。読み込み直後に保存すると、
  // 内容を見ずに再読み込みしただけで NEW が消えてしまう
  useEffect(() => {
    const commit = () => {
      if (latestDateRef.current) storageSet(SEEN_KEY, latestDateRef.current);
    };
    const onVis = () => {
      if (document.visibilityState === "hidden") commit();
    };
    window.addEventListener("pagehide", commit);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("pagehide", commit);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  // フィルター状態を URL に写す。チップ等の離散操作は履歴に積み、検索の打鍵は置き換える
  const prevFilters = useRef(filters);
  const skipWrite = useRef(false);
  useEffect(() => {
    if (skipWrite.current) {
      // popstate 由来の変更は URL が既に正しいので書かない
      skipWrite.current = false;
      prevFilters.current = filters;
      return;
    }
    const mode =
      prevFilters.current === filters || onlyQueryDiffers(prevFilters.current, filters)
        ? "replace"
        : "push";
    writeUrl(filters, openId, mode);
    prevFilters.current = filters;
  }, [filters, openId]);

  // 戻る／進む：URL から状態を復元。ダイジェストは history.state で開閉
  useEffect(() => {
    const onPop = () => {
      const { filters: f, item } = readUrl();
      skipWrite.current = true;
      setFilters(f);
      setOpenId(item);
      setDigestOpen(!!(history.state as { digest?: boolean } | null)?.digest);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const openDigest = useCallback(() => {
    history.pushState({ ...(history.state ?? {}), digest: true }, "");
    setDigestOpen(true);
  }, []);
  const closeDigest = useCallback(() => {
    if ((history.state as { digest?: boolean } | null)?.digest) history.back();
    else setDigestOpen(false);
  }, []);

  // ディープリンク／注目カードから開いた1件までスクロール。対象が後ろのページに
  // いると1回目の描画には存在しないので、少し待って数回探す
  useEffect(() => {
    if (!data || !openId) return;
    let tries = 0;
    let retry = 0;
    let unspot = 0;
    const attempt = () => {
      const el = document.getElementById("pick-" + openId);
      if (el) {
        el.scrollIntoView({ block: "center" });
        el.classList.add("spot");
        unspot = window.setTimeout(() => el.classList.remove("spot"), 2600);
        return;
      }
      if (++tries < 10) {
        retry = window.setTimeout(attempt, 100);
      } else {
        toast("そのアイテムは見つかりませんでした", { duration: 4000 });
        setOpenId(null);
      }
    };
    attempt();
    return () => {
      clearTimeout(retry);
      clearTimeout(unspot);
    };
  }, [data, openId]);

  // オフライン⇄オンラインの告知
  useEffect(() => {
    const off = () =>
      toast("オフラインです。保存済みのデータを表示しています", { duration: 5000 });
    const on = () => toast("オンラインに戻りました");
    window.addEventListener("offline", off);
    window.addEventListener("online", on);
    if (!navigator.onLine) off();
    return () => {
      window.removeEventListener("offline", off);
      window.removeEventListener("online", on);
    };
  }, []);

  const setViewPersist = (v: ViewMode) => {
    setView(v);
    storageSet(VIEW_KEY, v);
  };

  // 絞り込みを変えたら「開いている1件」は解除（URL からも外れる）
  const patch = (p: Partial<FilterState>) => {
    setOpenId(null);
    setFilters((s) => ({ ...s, ...p }));
  };
  const resetFilters = () => {
    setOpenId(null);
    setFilters(defaultFilterState);
  };

  /** 注目カード等から1件を指名して開く（リスト表示中でもカード表示に切り替える） */
  const selectItem = (id: string) => {
    setView("card");
    setOpenId(id);
  };

  const picks = data?.picks ?? [];
  const visible = useMemo(
    () => applyFilters(picks, filters, statuses, favorites, newIds),
    [picks, filters, statuses, favorites, newIds],
  );
  const highlights = useMemo(() => topSignals(picks, 3), [picks]);

  if (error) {
    return (
      <div className="center-note fatal" role="alert">
        <p className="mincho">データを読み込めませんでした。</p>
        <p className="sub">{error}</p>
        <button
          type="button"
          className="clear-link"
          onClick={() => setReloadTick((t) => t + 1)}
        >
          もう一度試す
        </button>
      </div>
    );
  }
  if (!data) {
    return <LoadingShell />;
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
        onOpenDigest={openDigest}
      />
      <Masthead meta={meta} />
      <div className="wrap">
        <button type="button" className="digest-banner" onClick={openDigest}>
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
          <FeatureRow items={highlights} meta={meta} onSelect={selectItem} />
        ) : null}
        <FilterBar
          meta={meta}
          state={filters}
          patch={patch}
          onReset={resetFilters}
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
          openId={openId}
          filterKey={JSON.stringify(filters)}
          onToggleFavorite={toggleFavorite}
          onSetStatus={setStatus}
          onSelectTag={(t) => patch({ query: t })}
          onClearFilters={resetFilters}
        />
      </main>
      <SiteFooter meta={meta} count={picks.length} />
      <BackToTop />
      <StoriesDigest
        picks={picks}
        meta={meta}
        open={digestOpen}
        onClose={closeDigest}
      />
    </>
  );
}
