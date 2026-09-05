/**
 * localStorage の安全ラッパー。
 * Safari のプライベートモードや容量超過では getItem/setItem 自体が例外を投げ、
 * 無防備に呼ぶと描画前に落ちて白画面になる。失敗しても黙って続ける。
 */
export function storageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function storageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* 保存できなくても動作は続ける */
  }
}
