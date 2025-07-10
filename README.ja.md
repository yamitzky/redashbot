# Redash用Slack Bot V2

[English README](https://github.com/yamitzky/redashbot/blob/main/README.md)

Redashbot V2は、[Redash](https://redash.io)のためのオープンソースSlack botです。

(hakobera/redashbotからフォークされましたが、ほぼすべてのコードを書き直し、V2として公開しています。)

## 機能

- Chartのスクリーンショット
- Dashboardのスクリーンショット
- 表形式の結果（※スクリーンショットではありません）
- Dockerデプロイメント
- <s>サーバーレスなデプロイメント</s>
- HTTP基盤の新しいSlackアプリ（非RTMスタイル）
- **オープンソース！**

![screenshot.png](./images/screenshot.png)

## 使用方法

- Visualization
  - `@botname <Query URL>#<Viz ID>`
    - e.g. `@redash https://your-redash-server.example.com/queries/1#2`
- Dashboard
  - `@botname <Dashboard URL>`
    - e.g. `@redash https://your-redash-server.example.com/dashboards/dashboard-name`
- Table
  - `@botname <Query URL>#table`
    - e.g. `@redash https://your-redash-server.example.com/queries/1#table`
    

## セットアップ

[Slackアプリを作成](https://api.slack.com/apps/)し、環境変数`SLACK_BOT_TOKEN`と`SLACK_SIGNING_SECRET`を設定してください。

[公式ドキュメント](https://slack.dev/bolt-js/tutorial/getting-started#create-an-app)を参照してください。

イベントサブスクリプションページでは、`Request URL`は`https://<your-domain>/slack/events`になります。

その後、`npm start`または`docker run yamitzky/redashbot:main`を実行して起動します。Dockerを使用する場合は、`-e`オプションまたは`.env`ファイルを介して環境変数を渡すことを忘れないでください。

### スラッシュコマンド（オプション）

`/redash-capture [URL]`でredashbotを使用できます。

アプリのスラッシュコマンドページで、[Create New Command]をクリックして送信します。`Command`は`/redash-capture`、`Request URL`は`https://<your-domain>/slack/events`を指定してください。

### ワークフローステップ（オプション）

redashbotをワークフローステップとして使用できます。

アプリのInteractivity & Shortcutsページで、Interactivityを有効にします。`Request URL`は`https://<your-domain>/slack/events`になります。

その後、Workflow Stepsページに移動し、[Add Step]をクリックして送信します。`Callback ID`は`redash_capture`を指定してください。

## 環境変数

### SLACK_BOT_TOKEN（必須）

SlackのBotトークン。

### SLACK_SIGNING_SECRET（必須）

Slackの署名シークレット。

### SLACK_SOCKET_MODE（オプション）

Socket Modeを有効にするには`true`に設定します。有効にすると、BotはHTTPエンドポイントの代わりにWebSocket接続を使用します。

### SLACK_APP_TOKEN（Socket Modeで必須）

Socket Mode用のアプリレベルトークン。`SLACK_SOCKET_MODE=true`の場合に必要です。トークンは`xapp-`で始まる必要があります。

### REDASH_HOSTとREDASH_API_KEY（オプション）

RedashのURLとそのAPIキー。

## REDASH_HOST_ALIAS（オプション）

Botからアクセス可能なRedashのURL。

### REDASH_HOSTS_AND_API_KEYS（オプション）

複数のRedashを一度に使用したい場合は、以下のようにこの変数を指定します。

```
REDASH_HOSTS_AND_API_KEYS="http://redash1.example.com;TOKEN1,http://redash2.example.com;TOKEN2"
```

または、各RedashにREDASH_HOST_ALIASを指定する必要がある場合は、以下のようにします。

```
REDASH_HOSTS_AND_API_KEYS="http://redash1.example.com;http://redash1-alias.example.com;TOKEN1,http://redash2.example.com;TOKEN2"
```

### SLEEP_TIME（オプション）

キャプチャ前に読み込み完了を待つミリ秒数。

### BROWSER（オプションかつ実験的）

`chromium`、`firefox`、または`webkit`。デフォルトは`chromium`です。

### REDASH_CUSTOM_HEADERS（オプション）

RedashリクエストにカスタムHTTPヘッダーを追加します。セミコロン区切りのkey:value形式で指定します。

例：
```
REDASH_CUSTOM_HEADERS="CF-Access-Client-Id:your-client-id;CF-Access-Client-Secret:your-client-secret"
```

## 開発方法

このリポジトリをクローンし、以下を実行します。

```bash
$ npm install
$ npx playwright install 
$ export REDASH_HOST=https://your-redash-server.example.com
$ export REDASH_API_KEY=your-redash-api-key
$ export SLACK_BOT_TOKEN=your-slack-bot-token
$ export SLACK_SIGNING_SECRET=your-slack-signing-secret
$ # Socket Mode（オプション）
$ export SLACK_SOCKET_MODE=true
$ export SLACK_APP_TOKEN=xapp-your-app-token
$ npm start
```

## デプロイ

RedashbotはNodeプログラムとして作られています。

```
npm start
```

### Docker

[Dockerイメージ](https://hub.docker.com/r/yamitzky/redashbot)が提供されています。現在、`latest`タグはv1（旧バージョン）に使用されているため、`2.0.0`などを使用する必要があります。

```
docker run -it --rm -e SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN -e SLACK_SIGNING_SECRET=$SLACK_SIGNING_SECRET -e REDASH_HOSTS_AND_API_KEYS=$REDASH_HOSTS_AND_API_KEYS -p 3000:3000 yamitzky/redashbot:2.0.0
```

docker-composeも提供されています。

```
docker-compose up
```

### Heroku（テストされていません！）

以下のボタンをクリックするだけで、簡単にredashbotをHerokuにデプロイできます。

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
