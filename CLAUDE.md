# QOLレーダー Web アプリ — 設計図 / ビルド指示書

> このファイルは新プロジェクトの `CLAUDE.md` としてそのまま使えます。
> 新プロジェクトを作ったらこれを置き、`data/picks.json`（種データ）を一緒に入れて、
> 「CLAUDE.md（SPEC）通りに作って」と頼めば実装が始められます。

---

## 1. これは何

「買ってよかった・QOL向上・時短・生活効率化」の良品情報を**蓄積して、企業サイト品質のWebアプリで眺める**ためのプロダクト。情報は定期収集でどんどん増え、スマホから気持ちよく閲覧・お気に入り管理できる。

3本柱：
- **① 収集（定期化）**：リサーチエージェントが新顔を集めて `data/picks.json` に追記
- **② 蓄積**：`picks.json` が唯一のデータソース。増えるほどアプリが充実
- **③ 閲覧（企業品質）**：React + shadcn/ui の静的サイトで、フィルタ・検索・お気に入り

## 2. アーキテクチャ

```
収集(/qol-radar改) ──追記──▶ data/picks.json ──読込──▶ React+shadcn 静的サイト ──デプロイ──▶ スマホ(URL)
```

- データ（`picks.json`）と表示（アプリ）を**完全分離**。収集はアプリのコードに触らずデータだけ増やす。
- アプリは**静的ビルド**（バックエンド不要）。`picks.json` を fetch して描画。

## 3. 技術スタック

- **Vite + React + TypeScript**
- **Tailwind CSS + shadcn/ui**（ユーザー環境に shadcn-ui MCP 導入済み。コンポーネントはMCP経由で正確に）
- 状態管理は不要レベル（React state）。お気に入り/ステータスは **localStorage** に保存
- アイコン：lucide-react
- デプロイ：**GitHub Pages**（GitHub Actions で push→自動ビルド&公開）。PWA化も任意で可。詳細は §11。
- データは `public/data/picks.json` に置き、`fetch(import.meta.env.BASE_URL + 'data/picks.json')` で読む（GitHub Pages のサブパス対応）

## 4. データモデル（picks.json）

`data/picks.json`（種データ同梱・20件）。1アイテム：

```json
{
  "id": "plaud-note",
  "name": "PLAUD NOTE",
  "genre": "gadget | housework | work | health | service",
  "trust": 3,          // 信頼度 1-3（★の数）
  "priceTier": 2,      // 価格帯 1=〜数千円 2=1〜3万 3=3万〜
  "blurb": "ひとこと推し",
  "tags": ["AI","仕事効率"],
  "dateAdded": "2026-06-24",
  "status": "new | interested | bought | skip",
  "sources": ["https://..."]
}
```

`meta` にジャンル名・凡例（trust/price/status）を持つ。**画面のラベルは meta から引く**（ハードコードしない）。

## 5. 画面・UI 仕様（モバイルファースト）

**1ページ構成のダッシュボード。** 上から：

1. **ヘッダー**：ロゴ「📡 QOLレーダー」＋ 総アイテム数 ＋ 最終更新日。スクロール追従。
2. **今号ハイライト**：`trust:3` かつ最新 `dateAdded` の上位3件を大きめカードで。
3. **フィルタバー**：
   - ジャンル（チップ：全/ガジェット/家事/仕事/健康/サービス）
   - 信頼度（★1+/★2+/★3）
   - 価格帯（¥/¥¥/¥¥¥）
   - ステータス（気になる/買った 等）
   - **検索ボックス**（name・blurb・tags を対象）
   - 並び替え（新着順／信頼度順／価格安い順）
4. **アイテムグリッド**：レスポンシブカード（スマホ1列→タブレット2列→PC3列）。各カードに：
   - ジャンル色の左アクセント or バッジ、name、★信頼度、¥価格帯、blurb、tags
   - **お気に入り(♡)** と **ステータス切替**（気になる/買った/スルー）→ localStorage 保存
   - 出典リンク（複数なら「ソース3件」表示）
5. **空状態**：フィルタ該当0件のときのメッセージ。

**インタラクション**：フィルタ/検索は即時反映。お気に入り・ステータスはリロードしても保持。

## 6. デザイン方針（企業サイト品質を出す）

- **frontend-design スキルを最初に効かせる**：陳腐な既定（AI多用フォント・紫グラデ）を避け、明確な美的方向を1つ選ぶ。候補：エディトリアル／クリーン・モダン／上質なミニマル。
- 配色：1アクセント＋中立グレースケール。ジャンルごとに識別色（控えめに）。
- タイポ：日本語可読性の高いサンセリフ＋数字は tabular。見出しに強弱。
- カード：余白・影・角丸を一貫。情報階層（name > blurb > meta）を明確に。
- **ダーク/ライト両対応**だと“それっぽさ”が出る。
- **render-check スキルで毎画面スクショ→目視→修正**のループを必ず回す（モバイル幅とPC幅の両方）。仕上げに `/code-review`。

## 7. 収集・定期化・蓄積の運用

- 収集は既存の **`/qol-radar` コマンド**を発展させ、出力先を「Driveのダイジェスト」だけでなく **`data/picks.json` への追記**にする。
  - 重複は `id`（kebab-case）で判定。既存idはスキップ、新顔のみ append。
  - `dateAdded` を付与。`status` は `new`。
- 定期化：`/loop`（セッション中に自走）または `/schedule` のRoutine。
  - データ追記後、`git commit` → `git push` で **GitHub Actions が自動ビルド&公開**（手動デプロイ不要）。蓄積→公開が一直線。
- ※Web検索はクラウドでも確実。git push 自体のクラウド側自動化は要検証。まずは**手動 or loop で確実に**回す。

## 8. ビルドのマイルストーン（新プロジェクトでの順序）

1. **v0 雛形**：Vite+React+TS+Tailwind+shadcn 初期化。`picks.json` を読んで素のリスト表示（動作確認）。
2. **v1 見た目**：frontend-design で方向決め → カードUI実装 → render-check で詰める（モバイル/PC）。
3. **v2 機能**：フィルタ・検索・並び替え・お気に入り(localStorage)・ステータス。
4. **v3 仕上げ**：今号ハイライト、ダーク/ライト、空状態、軽い演出。`/code-review`。
5. **v4 公開**：GitHub Pages 化（§11）。push→Actionsで自動公開。`<user>.github.io/<repo>/` をスマホ確認。任意でPWA化。
6. **v5 連携**：`/qol-radar` を picks.json 追記式に改修 → 定期実行で蓄積が回り出す。

## 9. 引き継ぐ資産

- **`data/picks.json`**：今日の20件（種データ）。これをそのまま使える。
- **`/qol-radar` コマンド**：収集エンジン（現状はDriveダイジェスト出力。v5でpicks.json追記に拡張）。
- **デザインスタック**：frontend-design / shadcn-ui MCP / render-check / webapp-testing（すべて導入済み・全プロジェクトで有効）。
- 元ダイジェスト：`マイドライブ\Claude成果物\Yorozuya\qol-radar\2026-06-24\`

## 10. 新プロジェクトの始め方（最初の一手）

1. 新フォルダを作る（例：`Desktop\Claude\qol-radar-app`）。git init 推奨。
2. この `SPEC.md` を `CLAUDE.md` として置く。`data/picks.json` も入れる。
3. そのフォルダで Claude Code を起動（新セッション＝shadcn MCP が有効）。
4. 「CLAUDE.md（SPEC）の v0→v1 を作って。まず picks.json を読んでカード表示、その後 frontend-design で企業品質に」と依頼。

## 11. GitHub Pages デプロイ（既定の公開方法）

このプロジェクトに限らず、Webの公開は **GitHub Pages を既定**にする。push→自動公開で、蓄積→公開が一直線になる。

**つまづき2点（必須）**
1. **base パス**：プロジェクトページ（`https://<user>.github.io/<repo>/`）はサブパス配信。`vite.config.ts` に `base: '/<repo名>/'` を設定（忘れると画面真っ白）。ユーザーサイト（`<user>.github.io` という名のリポジトリ）なら `base: '/'`。
2. **データ取得**：`fetch('/data/...')` は404になる。必ず `fetch(import.meta.env.BASE_URL + 'data/picks.json')` のように `BASE_URL` 起点にする。

**デプロイ＝GitHub Actions**（`.github/workflows/deploy.yml`）
- 構成：`actions/checkout` → setup-node → `npm ci` → `npm run build` → `actions/upload-pages-artifact`（`path: dist`）→ `actions/deploy-pages`。
- トリガー：`main` への push。
- 権限：`permissions: { contents: read, pages: write, id-token: write }`。
- リポジトリ **Settings → Pages → Source = "GitHub Actions"** に設定する（初回のみ）。

**その他**
- 本アプリは1ページ構成でクライアントルーティング無し → SPAの404対策は不要。
- private リポジトリで Pages を使うには GitHub Pro。public なら無料。
- 独自ドメインは任意（`public/CNAME`）。
