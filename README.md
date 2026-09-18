# ゆる英語（vibe-english）

> ゆるく続けられる英語。

表示名は「ゆる英語」。パッケージ名やリポジトリ名は `vibe-english` のままです。

短い英語チャンク（フレーズ）を、聞く → まねる → 使い方を知る → 穴埋め → 日本語から英語 → 全文 → 完了、の 7 ステップで毎日少しずつ練習する Web アプリです。

音声認識・録音・AI 採点はありません。読み上げはブラウザの SpeechSynthesis を使います。

## Tech stack

| 領域 | 技術 |
| --- | --- |
| フロントエンド | React + Vite |
| API | Hono |
| 実行環境 | Cloudflare Workers（静的アセット同梱） |
| 認証 | Better Auth（MVP は Google ログインのみ） |
| セッション | httpOnly Cookie |
| DB | Neon Postgres |
| DB アクセス | Kysely |
| 型生成 | kysely-codegen |
| マイグレーション | golang-migrate（生 SQL） |
| 認可 | Postgres RLS |

## Repository layout

```txt
apps/
  web/            React + Vite フロントエンド
  api/            Hono + Cloudflare Worker API
packages/
  db/             Kysely クライアント / 生成型 / トランザクションヘルパ
  domain/         共有ドメイン型とユースケース
  content/        Markdown チャンクのパーサ
  api-client/     型付き API クライアント（将来のモバイルアプリと共有）
db/
  migrations/     golang-migrate の SQL
  init/           ローカル Postgres 初期化（app ロール作成）
content/
  chunks/         オリジナルのレッスン Markdown
scripts/
  seed.ts         Markdown → DB の冪等シード
tests/            パーサテストと RLS 統合テスト
```

API は `apps/web` の中ではなく独立した `apps/api` にあります。将来モバイルアプリを追加する際は、同じ API と `packages/api-client` をそのまま再利用できます。

## Architecture

本番では 1 つの Cloudflare Worker が API と React 静的アセットの両方を同一オリジンで配信します。

```txt
/api/*  -> Hono API
/*      -> React / Vite の静的アセット
```

同一オリジンなので、Better Auth のセッション Cookie を httpOnly / SameSite=Lax のまま扱えます。

ローカル開発では 2 プロセスに分かれます。

```txt
Vite dev server : http://localhost:5173
Worker dev      : http://localhost:8787
```

フロントエンドは常に相対パス（`fetch("/api/...", { credentials: "include" })`）で呼び、Vite の proxy が `/api` を Worker に転送します。

## Setup

### 1. 依存関係

```bash
npm ci
```

Node.js 22 以上と [golang-migrate](https://github.com/golang-migrate/migrate) が必要です。

```bash
brew install golang-migrate
```

### 2. 環境変数

```bash
cp .env.example .env.local
cp apps/api/.dev.vars.example apps/api/.dev.vars
```

`.env.local` は Node のツール（マイグレーション・型生成・シード・テスト）が、`apps/api/.dev.vars` は Worker が読みます。**実際の値をコミットしないでください。**

| 変数 | 使う場所 | 説明 |
| --- | --- | --- |
| `DATABASE_URL` | Worker / ツール | アプリ用接続。RLS が効く非オーナーロール |
| `MIGRATION_DATABASE_URL` | ツール | マイグレーション・型生成・シード用のオーナー接続 |
| `APP_DATABASE_URL` | テスト | RLS テスト用のアプリロール接続（任意） |
| `BETTER_AUTH_SECRET` | Worker | `openssl rand -base64 32` で生成 |
| `BETTER_AUTH_URL` | Worker | ブラウザから見たオリジン |
| `GOOGLE_CLIENT_ID` | Worker | Google OAuth クライアント ID |
| `GOOGLE_CLIENT_SECRET` | Worker | Google OAuth クライアントシークレット |
| `CLOUDFLARE_API_TOKEN` | CI | デプロイ用（GitHub Secrets） |
| `CLOUDFLARE_ACCOUNT_ID` | CI | デプロイ用（GitHub Secrets） |

Google OAuth のリダイレクト URI には `${BETTER_AUTH_URL}/api/auth/callback/google` を登録します。

### 3. データベース

通常のローカル開発では Neon の development branch を使えます。ローカル Postgres で完結させたい場合は同梱の compose を使ってください。

```bash
docker compose up -d
```

これは 2 つのコンテナを起動します。

- `postgres` — Postgres 16。初期化時に非オーナーの `app` ロールを作成します
- `wsproxy` — Neon のドライバは Postgres を WebSocket 越しに話します。Neon 自身はこれを終端しますが、素の Postgres には無いため、ローカルではこのプロキシが同じ役割を担います

これにより、Worker のコードを一切変更せず Neon でもローカル Postgres でも動きます。

#### Database roles

RLS を「ドキュメント上の話」ではなく実際の防御層にするため、アプリの接続ロールは次を満たす必要があります。

- `BYPASSRLS` を **持たない**
- テーブルの **オーナーではない**
- スーパーユーザーではない

Neon でも同様に、マイグレーション用とは別のアプリ用ロールを作成してください。

```sql
CREATE ROLE app LOGIN PASSWORD '...' NOBYPASSRLS;
```

`tests/rls.test.ts` はこの前提を実際に検証します。

### 4. マイグレーションとシード

```bash
npm run db:migrate    # migrate up
npm run db:rollback   # 1 つ戻す
npm run db:codegen    # kysely-codegen で型生成
npm run db:sync       # migrate + codegen
npm run db:seed       # content/chunks/*.md を投入（冪等）
```

シードは何度実行しても同じ結果になります。Markdown から削除されたチャンクは、ユーザーの進捗を壊さないよう `is_active = false` にするだけで削除はしません。

## Local development

```bash
npm run dev:api   # http://localhost:8787
npm run dev:web   # http://localhost:5173
```

ブラウザでは <http://localhost:5173> を開きます。Vite が `/api` を Worker に転送します。

## Other commands

```bash
npm run typecheck   # 全パッケージの型チェック
npm test            # パーサテスト + RLS 統合テスト
npm run build       # web と worker のビルド
npm run deploy      # ビルドして Cloudflare にデプロイ
```

`npm test` は `DATABASE_URL` などが未設定の場合、RLS テストを自動でスキップします。

## Database design

アプリ用テーブルは `chunks` / `chunk_examples` / `chunk_drills`（公開コンテンツ）と、`user_progress` / `user_flags`（ユーザー固有）に分かれます。

後者は RLS を有効化し、トランザクションローカルな設定で保護しています。

```sql
using (user_id = current_setting('app.user_id', true))
with check (user_id = current_setting('app.user_id', true))
```

### Transaction boundary

トランザクション境界はユースケース層にあり、リポジトリはトランザクションを受け取って DB 操作だけを行います。

```ts
await withUserTransaction(db, userId, async (trx) => {
  return usecaseLogic(trx);
});
```

このヘルパはトランザクション開始直後に次を実行します。

```sql
select set_config('app.user_id', $1, true)
```

第 3 引数が `true`（トランザクションローカル）なので、設定はコミット／ロールバックで必ず破棄され、プールされた接続経由で他のユーザーに漏れません。

読み取り専用のユースケースもこのヘルパを使います。設定が無ければ RLS は 0 件を返します。

## API

認証系（`/api/auth/*`）以外のすべてのルートは認証必須で、未認証なら 401 を返します。

```txt
GET    /api/me
GET    /api/chunks/today
GET    /api/chunks/:id
POST   /api/chunks/:id/complete
POST   /api/chunks/:id/flags/hard
DELETE /api/chunks/:id/flags/hard
GET    /api/flags/hard
```

## Design

UI の決めごとは [docs/DESIGN.md](docs/DESIGN.md) にまとめています。色の役割、
イエローの面積制限、角丸・影・フォントの使い分け、やらないことなど。
新しい画面を追加するときは先に目を通してください。

色の直書きは `npm run check:design` が CI で弾きます。

## Lesson content

レッスンは `content/chunks/*.md` で Git 管理します。1 ファイル 1 チャンクで、front matter と日本語の見出しで構成します。`## 内部メモ` はアプリには一切表示されません（テストで担保しています）。

新しいチャンクを追加したら `npm run db:seed` を実行してください。

## Deployment

`main` への push で `.github/workflows/deploy.yml` が動きます。

1. Neon 本番に `migrate up`（適用済みのものは何もしません）
2. レッスンコンテンツをシード
3. ビルド
4. Cloudflare Workers にデプロイ

Cloudflare / DB の Secret が未設定の場合、ジョブは失敗せずスキップします。

Worker の実行時シークレットは、ビルド時の環境変数ではなく Worker 側に設定します。

```bash
wrangler secret put DATABASE_URL
wrangler secret put BETTER_AUTH_SECRET
wrangler secret put BETTER_AUTH_URL
wrangler secret put GOOGLE_CLIENT_ID
wrangler secret put GOOGLE_CLIENT_SECRET
```

本番の `BETTER_AUTH_URL` はデプロイ先のオリジンにし、その URL を Google OAuth のリダイレクト URI にも登録してください。

## CI

PR では `.github/workflows/ci.yml` が Postgres サービスを起動し、マイグレーション → 型生成 → 型チェック → テスト → ビルドを実行します。生成済みの型が古い場合も失敗します。

## Security note

このリポジトリは public です。

- 実際のシークレット、認証情報、API キー、DB URL、OAuth シークレット、Cloudflare トークンをコミットしないでください
- `.env*` と `.dev.vars*` は `.gitignore` 済みです（`*.example` のみ追跡）
- シークレットは GitHub Secrets と Worker secrets で管理します

## Lesson content originality

MVP のレッスンコンテンツ（フレーズ、例文、説明、ドリル、並び順）はすべてこのプロジェクトのために書き下ろしたオリジナルです。既存の書籍・有料教材・著作権のある資料から、例文・解説・構成・ドリルを転載していません。

コンテンツを追加する場合も同じ方針を守ってください。

## Not in MVP

音声認識 / 録音 / AI 採点 / SRS アルゴリズム / 課金 / メール・パスワード認証 / MFA / LINE ログイン / 管理 CMS / 音声ファイル管理 / AI によるレッスン生成 / 組織・チーム機能。
