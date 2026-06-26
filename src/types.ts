export type Genre = "gadget" | "housework" | "work" | "health" | "service";
export type Status = "new" | "interested" | "bought" | "skip";

export interface Pick {
  id: string;
  name: string;
  genre: Genre;
  /** 信頼度 1–3 */
  trust: number;
  /** 価格帯 1=〜数千円, 2=1〜3万, 3=3万〜 */
  priceTier: number;
  blurb: string;
  /** 推しポイント（なぜ良いか・2〜3点）。任意 */
  points?: string[];
  /** 背景写真。"img/foo.jpg"(リポ同梱) か絶対URL。任意（無ければグラデ） */
  image?: string;
  tags: string[];
  dateAdded: string;
  status: Status;
  sources: string[];
}

export interface PicksMeta {
  title: string;
  description: string;
  lastUpdated: string;
  genres: Record<string, string>;
  trustLegend: Record<string, string>;
  priceLegend: Record<string, string>;
  statusLegend: Record<string, string>;
}

export interface PicksData {
  meta: PicksMeta;
  picks: Pick[];
}
