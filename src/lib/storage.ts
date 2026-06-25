import { useCallback, useEffect, useState } from "react";
import type { Status } from "@/types";

const FAV_KEY = "qol-favorites";
const STATUS_KEY = "qol-status";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** お気に入り（♡）の id 集合を localStorage に永続化 */
export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(
    () => new Set(readJSON<string[]>(FAV_KEY, [])),
  );

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify([...ids]));
  }, [ids]);

  const toggleFavorite = useCallback((id: string) => {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { favorites: ids, toggleFavorite };
}

/** ステータスのユーザー上書きを localStorage に永続化（未設定なら picks.json の値を使う） */
export function useStatuses() {
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    readJSON<Record<string, Status>>(STATUS_KEY, {}),
  );

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  }, [statuses]);

  /** status を null にすると上書きを解除（＝元の status に戻す） */
  const setStatus = useCallback((id: string, status: Status | null) => {
    setStatuses((prev) => {
      const next = { ...prev };
      if (status === null) delete next[id];
      else next[id] = status;
      return next;
    });
  }, []);

  return { statuses, setStatus };
}
