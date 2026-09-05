import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Toaster, toast } from "@/lib/toast";
import "@/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
    <Toaster />
  </StrictMode>,
);

// オフライン対応の Service Worker（本番のみ）
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(import.meta.env.BASE_URL + "sw.js", {
        scope: import.meta.env.BASE_URL,
      })
      .catch(() => {
        /* SW 登録失敗は無視（通常表示は維持） */
      });
    // 新しい版が制御を握ったら（＝デプロイ後の再訪）、再読み込みを促す。
    // 初回インストール時にも controllerchange は発火するので、既に controller が
    // あった場合だけ「更新」として扱う。
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!hadController) return;
      toast("新しい版があります", {
        duration: 0,
        action: { label: "更新", onClick: () => location.reload() },
      });
    });
  });
}
