import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/** 一定以上スクロールしたら現れる「トップへ戻る」ボタン */
export function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;
  return (
    <button
      type="button"
      className="to-top"
      aria-label="ページの先頭へ戻る"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <ArrowUp size={18} strokeWidth={1.8} />
    </button>
  );
}
