## セットアップ

依存関係のインストール

```bash
npm install
```

## 開発用サーバー起動

http://localhost:8080 で起動する

```bash
npm start
```

## Production

ビルド. 成果物が dist ディレクトリー以下に出来る

```bash
npm run generate
```

Locally preview production build:

```bash
npm run preview
```

## テスト

### GUI

```bash
npm run test
```

Nova 画面の GUI テストを開く

```bash
npm run test:nova
```

### CUI

```bash
npm run test:e2e
```

Nova 画面の CUI テストを実行する

```bash
npm run test:e2e:nova
```

### 一部のテストのみ実行

```bash
npx start-server-and-test start http://localhost:8080 "cypress run --e2e --spec 'cypress/e2e/terminals/01-terminal-create.cy.ts'"
npx start-server-and-test start http://localhost:8080 "cypress run --e2e --spec 'cypress/e2e/terminals/**/*.cy.ts'"
```

#### Nova 画面のテストの場合は baseUrlの指定が必須

```bash
npx start-server-and-test start http://localhost:8080 "cypress run --e2e --config baseUrl=http://localhost:8080/nova --spec 'cypress/e2e/vpns/**/*.cy.nova.ts'"
```

### GUI テストの遷移先や spec を実行時に差し替える

`cy:open` は環境変数 `BASE_URL` と `SPEC` を読む。

```bash
BASE_URL=http://localhost:8080 SPEC='cypress/e2e/**/*.cy.ts' npm run test
BASE_URL=http://localhost:8080/nova SPEC='cypress/e2e/**/*.cy.nova.ts' npm run test
```

`npm run test:nova` は次のコマンドの別名。

```bash
BASE_URL=http://localhost:8080/nova SPEC='cypress/e2e/**/*.cy.nova.ts' npm run test
```

`cy:run` と `cy:serial` も同じ環境変数を読む。

```bash
BASE_URL=http://localhost:8080 SPEC='cypress/e2e/**/*.cy.ts' npm run test:e2e
BASE_URL=http://localhost:8080 SPEC='cypress/e2e/**/*.cy.ts' npm run test:serial
BASE_URL=http://localhost:8080/nova SPEC='cypress/e2e/**/*.cy.nova.ts' npm run test:e2e
BASE_URL=http://localhost:8080/nova SPEC='cypress/e2e/**/*.cy.nova.ts' npm run test:serial
```

`npm run test:e2e:nova` と `npm run test:serial:nova` はそれぞれ次のコマンドの別名。

```bash
BASE_URL=http://localhost:8080/nova SPEC='cypress/e2e/**/*.cy.nova.ts' npm run test:e2e
BASE_URL=http://localhost:8080/nova SPEC='cypress/e2e/**/*.cy.nova.ts' npm run test:serial
```

## アイコン運用

- Vuetify 標準のアイコンは MDI を使う。`mdi-home` のように既存の書き方を維持してよい。
- app/assets/icons/nova 配下の独自 SVG を Vuetify から使う場合は `nova:sort-arrows` のように set 名付きで指定する。
- よく使う独自 SVG は alias でも使える。たとえば `icon="$novaSortArrows"` や `icon="$novaOrderHistory"` のように指定できる。
- 既存の `~icons/ztgict/...` 直接 import は旧UI用に残す。新UIの画面側では `~icons/nova/...` を直接 import せず、使う場合は `<v-icon/>` や `append-icon` などの props から指定する。
