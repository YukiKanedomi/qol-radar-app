// Supabase 接続情報。anon キーは公開前提の鍵なのでクライアントに入れてよい
// （データは RLS と「コードレス共有」の設計で運用）。ユーザーから受領後に値を埋める。
export const SUPABASE_URL = "https://udnsjukjtmytyqywyygp.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_Z9NhD4uCPoQWJt5py8qFvw_S2KPRoIu";

/** コードレス共有：全員が同じ1部屋を共有 */
export const SYNC_ROOM = "global";

export function isSyncConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}
