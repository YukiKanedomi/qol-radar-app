import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Pick, PicksMeta } from "@/types";
import { genreGradient, shortLabel } from "@/lib/picks";
import { buildDigest } from "@/lib/digest";

const DUR = 6000;
const BRAND_BG = "linear-gradient(160deg, #21413d 0%, #0e1a18 100%)";

type Slide =
  | { type: "intro" }
  | { type: "pick"; pick: Pick; n: number }
  | { type: "outro" };

function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const on = () => setReduce(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduce;
}

export function StoriesDigest({
  picks,
  meta,
  open,
  onClose,
}: {
  picks: Pick[];
  meta: PicksMeta;
  open: boolean;
  onClose: () => void;
}) {
  const digest = useMemo(
    () => buildDigest(picks, { mode: "weekly", limit: 12 }),
    [picks],
  );
  const slides = useMemo<Slide[]>(
    () => [
      { type: "intro" },
      ...digest.map((p, i): Slide => ({ type: "pick", pick: p, n: i + 1 })),
      { type: "outro" },
    ],
    [digest],
  );

  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const reduceMotion = usePrefersReducedMotion();
  const pausedRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const last = slides.length - 1;
  const atEnd = index >= last;
  const goNext = useCallback(() => setIndex((i) => Math.min(i + 1, last)), [last]);
  const goPrev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), []);

  useEffect(() => {
    if (open) {
      setIndex(0);
      setProgress(0);
    }
  }, [open]);

  // 自動送り（reduced-motion時はしない）
  useEffect(() => {
    if (!open) return;
    if (reduceMotion) {
      setProgress(1);
      return;
    }
    let raf = 0;
    let start = performance.now();
    let elapsed = 0;
    const step = (t: number) => {
      if (pausedRef.current) start = t - elapsed;
      elapsed = t - start;
      const f = Math.min(elapsed / DUR, 1);
      setProgress(f);
      if (f >= 1) {
        if (!atEnd) goNext();
        return;
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [open, index, reduceMotion, atEnd, goNext]);

  // キーボード（←/→/Esc）＋簡易フォーカストラップ
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      } else if (e.key === "Tab") {
        const f = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (!f || f.length === 0) return;
        const first = f[0];
        const lastEl = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, goNext, goPrev, onClose]);

  // フォーカス移動＋スクロールロック＋復帰
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const id = requestAnimationFrame(() => closeBtnRef.current?.focus());
    return () => {
      cancelAnimationFrame(id);
      document.body.style.overflow = "";
      opener?.focus?.();
    };
  }, [open]);

  // ポインタ：長押し(>200ms)で一時停止、短タップはゾーンで前/次
  const hold = useRef({ timer: 0 as ReturnType<typeof setTimeout> | 0, held: false });
  const startHold = () => {
    hold.current.held = false;
    hold.current.timer = setTimeout(() => {
      hold.current.held = true;
      pausedRef.current = true;
    }, 200);
  };
  const endHold = () => {
    clearTimeout(hold.current.timer);
    pausedRef.current = false;
  };
  const zoneClick = (dir: 1 | -1) => {
    if (hold.current.held) {
      hold.current.held = false;
      return; // 長押しだったのでめくらない
    }
    dir === 1 ? goNext() : goPrev();
  };

  if (!open) return null;

  const slide = slides[index];

  return (
    <div
      className="stories"
      role="dialog"
      aria-modal="true"
      aria-label="今週のダイジェスト"
      ref={dialogRef}
    >
      <div className="stories-phone">
        {/* progress */}
        <div className="stories-bars">
          {slides.map((_, i) => (
            <div
              key={i}
              className={"seg" + (i < index ? " done" : "")}
              aria-hidden="true"
            >
              <i style={{ width: i < index ? "100%" : i === index ? `${progress * 100}%` : "0%" }} />
            </div>
          ))}
        </div>

        {/* header */}
        <div className="stories-hd">
          <span className="logo">📡 {meta.title}</span>
          <span>· 今週のダイジェスト</span>
          <button
            type="button"
            className="stories-close"
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="ダイジェストを閉じる"
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>

        {/* card */}
        <StoryCard
          key={index}
          slide={slide}
          meta={meta}
          totalCount={picks.length}
          digest={digest}
        />

        {/* tap zones（アクセシブルなボタン） */}
        <button
          type="button"
          className="stories-zone stories-zone-prev"
          aria-label="前のカード"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onClick={() => zoneClick(-1)}
        />
        <button
          type="button"
          className="stories-zone stories-zone-next"
          aria-label="次のカード"
          onPointerDown={startHold}
          onPointerUp={endHold}
          onPointerLeave={endHold}
          onPointerCancel={endHold}
          onClick={() => zoneClick(1)}
        />
      </div>
    </div>
  );
}

function StoryCard({
  slide,
  meta,
  totalCount,
  digest,
}: {
  slide: Slide;
  meta: PicksMeta;
  totalCount: number;
  digest: Pick[];
}) {
  if (slide.type === "intro") {
    return (
      <div className="stories-card center" style={{ background: BRAND_BG }}>
        <div className="inner">
          <div className="kicker">{meta.title}</div>
          <div className="big">
            今週の
            <br />
            ダイジェスト
          </div>
          <p className="sub">
            蓄積した <b>{totalCount}件</b> から、今週の{" "}
            <b>注目 {digest.length}選</b>。
            <br />
            タップで次へ、長押しで一時停止。
          </p>
        </div>
        <div className="stories-hint">▶ タップでスタート</div>
      </div>
    );
  }

  if (slide.type === "outro") {
    const byGenre: Record<string, number> = {};
    for (const p of digest) byGenre[p.genre] = (byGenre[p.genre] ?? 0) + 1;
    const max = Math.max(1, ...Object.values(byGenre));
    const genreKeys = Object.keys(meta.genres).filter((g) => byGenre[g]);
    return (
      <div
        className="stories-card center"
        style={{ background: "linear-gradient(160deg,#13233f,#0c1526)" }}
      >
        <div className="inner">
          <div className="kicker">まとめ</div>
          <div className="big small">今週のジャンル内訳</div>
          <div className="statrow">
            {genreKeys.map((g) => (
              <div className="stat" key={g}>
                <div className="lab">
                  <span>{shortLabel(meta.genres[g])}</span>
                  <span>{byGenre[g]}</span>
                </div>
                <div className="barbg">
                  <div
                    className="barfg"
                    style={{
                      width: `${Math.round((byGenre[g] / max) * 100)}%`,
                      background: genreGradient(g),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="sub">
            続きは本体で。気になるものは <b>♡</b>、買ったら <b>✓</b>。
          </p>
        </div>
      </div>
    );
  }

  const p = slide.pick;
  return (
    <div className="stories-card" style={{ background: genreGradient(p.genre) }}>
      <div className="bgnum" aria-hidden="true">
        {String(slide.n).padStart(2, "0")}
      </div>
      <div className="inner">
        <div className="gchip">{shortLabel(meta.genres[p.genre])}</div>
        <h2 className="name mincho">{p.name}</h2>
        <p className="blurb">{p.blurb}</p>
        {p.points && p.points.length > 0 ? (
          <ul className="pts">
            {p.points.map((pt) => (
              <li className="pt" key={pt}>
                <span className="ck">✓</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="smeta">
          <span className="m">{"★".repeat(Math.max(1, Math.min(3, p.trust)))}</span>
          <span className="m">{"¥".repeat(Math.max(1, Math.min(3, p.priceTier)))}</span>
          {p.tags.slice(0, 2).map((t) => (
            <span className="stag" key={t}>
              #{t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
