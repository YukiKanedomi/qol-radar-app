import type { SupabaseClient } from "@supabase/supabase-js";
import type { Status } from "@/types";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SYNC_ROOM,
  isSyncConfigured,
} from "./syncConfig";

export interface PrefRow {
  item: string;
  fav: boolean;
  status: Status | null;
  updated_at: string;
}

let clientPromise: Promise<SupabaseClient> | null = null;

/** supabase-js は同期ON時のみ動的読み込み（初期バンドルを軽く保つ） */
async function getClient(): Promise<SupabaseClient | null> {
  if (!isSyncConfigured()) return null;
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: false },
      }),
    );
  }
  return clientPromise;
}

/** 共有ルームの全件取得 */
export async function fetchAllPrefs(): Promise<PrefRow[]> {
  const c = await getClient();
  if (!c) return [];
  const { data, error } = await c
    .from("prefs")
    .select("item,fav,status,updated_at")
    .eq("room", SYNC_ROOM);
  if (error) throw error;
  return (data ?? []) as PrefRow[];
}

/** 1アイテムの状態を upsert（fav と status をまとめて保存） */
export async function upsertPref(
  item: string,
  fav: boolean,
  status: Status | null,
): Promise<void> {
  const c = await getClient();
  if (!c) return;
  const { error } = await c.from("prefs").upsert(
    {
      room: SYNC_ROOM,
      item,
      fav,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "room,item" },
  );
  if (error) throw error;
}

/** リアルタイム購読。変更行ごとに onChange を呼ぶ。戻り値（Promise）で購読解除 */
export async function subscribePrefs(
  onChange: (row: PrefRow) => void,
  onStatus?: (ok: boolean) => void,
): Promise<() => void> {
  const c = await getClient();
  if (!c) return () => {};
  const channel = c
    .channel(`prefs-${SYNC_ROOM}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "prefs",
        filter: `room=eq.${SYNC_ROOM}`,
      },
      (payload) => {
        const row = (payload.new ?? payload.old) as PrefRow | null;
        if (row && row.item) onChange(row);
      },
    )
    .subscribe((status) => {
      onStatus?.(status === "SUBSCRIBED");
    });

  return () => {
    c.removeChannel(channel);
  };
}
