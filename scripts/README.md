# scripts — データ運用（v5 収集連携）

QOLレーダーの「収集→蓄積→公開」を一直線にするためのスクリプト。

## データの正本は1つ

- **正本**: `data/picks.json` … 収集が追記する唯一のファイル。git 管理対象。
- **配信用**: `public/data/picks.json` … アプリが実際に fetch するコピー。**生成物**（`.gitignore` 済み）。
  `data/picks.json` から `sync-picks.mjs` が自動生成する。手で編集しない。

`predev` / `prebuild`（package.json）で sync が自動実行されるため、`npm run dev` / `npm run build`
のたびに配信用コピーは正本と一致する。GitHub Actions のビルドでも同様に再生成される。

## sync-picks.mjs

`data/picks.json` → `public/data/picks.json` へコピーするだけ。dev/build 前に自動実行。

## add-picks.mjs（収集の追記）

```
node scripts/add-picks.mjs <candidates.json>
# 例: npm run add-picks -- /path/to/candidates.json
```

`candidates.json` は Pick 候補の配列。各要素:

```json
{
  "id": "anker-prime-charger",   // 必須・英数 kebab-case（日本語名は空になるため明示する）
  "name": "Anker Prime 充電器",   // 必須
  "genre": "gadget",              // 必須・gadget|housework|work|health|service のみ
  "trust": 3,                      // 1–3（既定 1）
  "priceTier": 2,                  // 1–3（既定 2）
  "blurb": "ひとこと推し",
  "tags": ["充電", "整理"],
  "sources": ["https://..."]
}
```

挙動: **既存 `id` はスキップ**（重複回避）、不正 `genre` もスキップ。新顔のみ
`dateAdded`=当日(JST)・`status`="new" を付けて `data/picks.json` に追記し、`meta.lastUpdated` を更新する。

## 公開

`data/picks.json` を commit して `git push origin main` すると GitHub Actions が自動ビルド&公開する。
（収集フローの全体は `/qol-radar` コマンドの「picks.json 追記モード」を参照）
