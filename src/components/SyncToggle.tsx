import { Cloud, CloudOff } from "lucide-react";
import type { SyncStatus } from "@/lib/useCollection";

export function SyncToggle({
  status,
  on,
  onToggle,
}: {
  status: SyncStatus;
  on: boolean;
  onToggle: () => void;
}) {
  const live = status === "live";
  const error = status === "error";
  const label = error
    ? "同期エラー（タップで再接続）"
    : live
      ? "みんなと同期中（タップで停止）"
      : on
        ? "接続中…"
        : "みんなと同期する";

  return (
    <button
      type="button"
      className={
        "theme-toggle sync-toggle" + (live ? " on" : "") + (error ? " err" : "")
      }
      onClick={onToggle}
      aria-pressed={on}
      aria-label={label}
      title={label}
    >
      {on && !error ? (
        <Cloud size={16} strokeWidth={1.8} />
      ) : (
        <CloudOff size={16} strokeWidth={1.8} />
      )}
    </button>
  );
}
