import { useEffect, useState } from "react";

/**
 * 画面下に短く出る通知。状態変更の確認（元に戻す付き）、共有リンクのコピー、
 * 新しい版の案内、オフライン表示の告知に使う。
 * 呼び出し側は toast() を叩くだけ。<Toaster/> を1つ置く。
 */
export interface ToastOptions {
  /** 操作ボタン（例: 元に戻す / 更新） */
  action?: { label: string; onClick: () => void };
  /** 自動で消えるまでの ms。0 なら消えない（更新案内など） */
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
  message: string;
}

type Listener = (items: ToastItem[]) => void;
let items: ToastItem[] = [];
let seq = 0;
const listeners = new Set<Listener>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

function emit() {
  for (const l of listeners) l(items);
}

export function dismissToast(id: number) {
  const t = timers.get(id);
  if (t) clearTimeout(t);
  timers.delete(id);
  items = items.filter((i) => i.id !== id);
  emit();
}

export function toast(message: string, opts: ToastOptions = {}): number {
  const id = ++seq;
  const duration = opts.duration ?? 3200;
  // 同時に積み上がらないよう最新2件まで
  items = [...items.slice(-1), { id, message, ...opts }];
  emit();
  if (duration > 0) timers.set(id, setTimeout(() => dismissToast(id), duration));
  return id;
}

export function Toaster() {
  const [list, setList] = useState<ToastItem[]>(items);
  useEffect(() => {
    listeners.add(setList);
    return () => {
      listeners.delete(setList);
    };
  }, []);
  if (list.length === 0) return null;
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div className="toast" key={t.id}>
          <span className="toast-msg">{t.message}</span>
          {t.action ? (
            <button
              type="button"
              className="toast-act"
              onClick={() => {
                t.action?.onClick();
                dismissToast(t.id);
              }}
            >
              {t.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
