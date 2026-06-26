import { useCallback, useEffect, useRef, useState } from "react";
import type { Status } from "@/types";
import { isSyncConfigured } from "./syncConfig";
import { fetchAllPrefs, subscribePrefs, upsertPref, type PrefRow } from "./sync";

const FAV_KEY = "qol-favorites";
const STATUS_KEY = "qol-status";
const SYNC_KEY = "qol-sync";

export type SyncStatus = "off" | "connecting" | "live" | "error";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * お気に入り・ステータスを localStorage に保存しつつ、任意で Supabase 同期する。
 * 同期OFF時は完全にローカル動作（従来どおり）。同期ONで共有ルームと双方向同期。
 */
export function useCollection() {
  const [favorites, setFavorites] = useState<Set<string>>(
    () => new Set(readJSON<string[]>(FAV_KEY, [])),
  );
  const [statuses, setStatuses] = useState<Record<string, Status>>(() =>
    readJSON<Record<string, Status>>(STATUS_KEY, {}),
  );
  const [syncOn, setSyncOn] = useState<boolean>(
    () => isSyncConfigured() && localStorage.getItem(SYNC_KEY) === "1",
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("off");

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify([...favorites]));
  }, [favorites]);
  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  }, [statuses]);

  // 非同期コールバック内で最新値を読むための ref
  const favRef = useRef(favorites);
  favRef.current = favorites;
  const statusRef = useRef(statuses);
  statusRef.current = statuses;
  const syncOnRef = useRef(syncOn);
  syncOnRef.current = syncOn;

  /** リモート行をローカルへ反映 */
  const applyRemote = useCallback((row: PrefRow) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (row.fav) next.add(row.item);
      else next.delete(row.item);
      return next;
    });
    setStatuses((prev) => {
      const next = { ...prev };
      if (row.status) next[row.item] = row.status;
      else delete next[row.item];
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    // 次の状態は ref から同期的に決める（setState 更新関数は非同期で走るため
    // クロージャ変数に書くと upsert に古い値が渡る）
    const nextFav = !favRef.current.has(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (nextFav) next.add(id);
      else next.delete(id);
      return next;
    });
    if (syncOnRef.current) {
      upsertPref(id, nextFav, statusRef.current[id] ?? null).catch(() =>
        setSyncStatus("error"),
      );
    }
  }, []);

  const setStatus = useCallback((id: string, status: Status | null) => {
    setStatuses((prev) => {
      const next = { ...prev };
      if (status === null) delete next[id];
      else next[id] = status;
      return next;
    });
    if (syncOnRef.current) {
      upsertPref(id, favRef.current.has(id), status).catch(() =>
        setSyncStatus("error"),
      );
    }
  }, []);

  // 同期ライフサイクル：取得→マージ→リアルタイム購読
  useEffect(() => {
    if (!syncOn || !isSyncConfigured()) {
      setSyncStatus("off");
      return;
    }
    let cancelled = false;
    let unsub = () => {};
    setSyncStatus("connecting");

    (async () => {
      try {
        const rows = await fetchAllPrefs();
        if (cancelled) return;
        const remoteItems = new Set(rows.map((r) => r.item));

        // 既知アイテムはリモート優先で反映
        setFavorites((prev) => {
          const next = new Set(prev);
          for (const r of rows) {
            if (r.fav) next.add(r.item);
            else next.delete(r.item);
          }
          return next;
        });
        setStatuses((prev) => {
          const next = { ...prev };
          for (const r of rows) {
            if (r.status) next[r.item] = r.status;
            else delete next[r.item];
          }
          return next;
        });

        // ローカルにしか無い状態は共有へ送る（相手にも見えるように）
        const localFav = favRef.current;
        const localStatus = statusRef.current;
        const toPush = new Set<string>();
        localFav.forEach((id) => {
          if (!remoteItems.has(id)) toPush.add(id);
        });
        Object.keys(localStatus).forEach((id) => {
          if (!remoteItems.has(id)) toPush.add(id);
        });
        for (const id of toPush) {
          await upsertPref(id, localFav.has(id), localStatus[id] ?? null);
        }
        if (cancelled) return;

        const u = await subscribePrefs(applyRemote, (ok) =>
          setSyncStatus(ok ? "live" : "connecting"),
        );
        if (cancelled) {
          u();
          return;
        }
        unsub = u;
      } catch {
        if (!cancelled) setSyncStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      unsub();
    };
  }, [syncOn, applyRemote]);

  const toggleSync = useCallback(() => {
    setSyncOn((on) => {
      const next = !on;
      try {
        localStorage.setItem(SYNC_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return {
    favorites,
    statuses,
    toggleFavorite,
    setStatus,
    sync: {
      configured: isSyncConfigured(),
      on: syncOn,
      status: syncStatus,
      toggle: toggleSync,
    },
  };
}
