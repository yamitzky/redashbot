# Slack Bot for Redash V2

Redashbot V2 is a open-source slack bot for [Redash](https://redash.io).

(This project was forked from hakobera/redashbot, but it is not maintained anymore. I have rewritten almost all of the code and published as v2.)

## Features

- Visualization(Chart) screenshot
- Dashboard screenshot
- Table result (*NOT SCREENSHOT*)
- Docker deployment
- <s>Serverless deployment</s>
- HTTP-based New Slack app (non-RTM style)
- **Open source!**

![screenshot.png](./images/screenshot.png)


## Usage

- Visualization
  - `@botname <Query URL>#<Viz ID>`
    - e.g. `@redash https://your-redash-server.example.com/queries/1#2`
- Dashboard
  - `@botname <Dashboard URL>`
    - e.g. `@redash https://your-redash-server.example.com/dashboards/dashboard-name`
- Table
  - `@botname <Query URL>#table`
    - e.g. `@redash https://your-redash-server.example.com/queries/1#table`
    
## Setup

[Create a Slack app](https://api.slack.com/apps/) and set environment variables `SLACK_BOT_TOKEN` and `SLACK_SIGNING_SECRET`.

[The Official Document](https://slack.dev/bolt-js/tutorial/getting-started#create-an-app).

On Event Subscription page, `Request URL` will be `https://<your-domain>/slack/events`.

Then, `npm start` or `docker run yamitzky/redashbot:main` to start. When you use Docker, do not forget to pass environment variable via `-e` or `.env` file.

### Slash Command (Optional)

You can use redashbot with `/redash-capture [URL]`.

On Slash Command page of your app, click [Create New Command] and submit. `Command` must be `/redash-capture` and `Request URL` will be `https://<your-domain>/slack/events`.

### Workflow Steps (Optional)

You can use redashbot as a Workflow step.

On Interactivity & Shortcuts page of your app, enable Interactivity. `Request URL` will be `https://<your-domain>/slack/events`.

Then, move to Workflow Steps page, and click [Add Step] and submit. `Callback ID` must be `redash_capture`.


## Environment variables

### SLACK_BOT_TOKEN (required)

Slack's bot token.

### SLACK_SIGNING_SECRET (required)

Slack's sigining secret.

### REDASH_HOST and REDASH_API_KEY (optional)

Redash's URL and its API Key.

## REDASH_HOST_ALIAS (optional)

Redash' URL accessible from the bot.

### REDASH_HOSTS_AND_API_KEYS (optional)

If you want to use multiple Redash at once, specify this variable like below

```
REDASH_HOSTS_AND_API_KEYS="http://redash1.example.com;TOKEN1,http://redash2.example.com;TOKEN2"
```

or if you need to specify REDASH_HOST_ALIAS for each Redash, like below

```
REDASH_HOSTS_AND_API_KEYS="http://redash1.example.com;http://redash1-alias.example.com;TOKEN1,http://redash2.example.com;TOKEN2"
```

### SLEEP_TIME (optional)

Milliseconds to wait loading finished before capturing.

### BROWSER (optional and experimental)

`chromium`, `firefox` or `webkit`. default is `chromium`

## How to develop

Clone this repository, then

```bash
$ npm install
$ export REDASH_HOST=https://your-redash-server.example.com
$ export REDASH_API_KEY=your-redash-api-key
$ export SLACK_BOT_TOKEN=your-slack-bot-token
$ node index.js
```

## Deploy

Redashbot is just a node program.

```
npm start
```

### Docker

[Docker image](https://hub.docker.com/r/yamitzky/redashbot) is provided. Currently, `latest` tag is used for v1(old), then you must use `2.0.0` or something like that.

```
docker run -it --rm -e SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN -e SLACK_SIGNING_SECRET=$SLACK_SIGNING_SECRET -e REDASH_HOSTS_AND_API_KEYS=$REDASH_HOSTS_AND_API_KEYS -p 3000:3000 yamitzky/redashbot:2.0.0
```

docker-compose is also provided.

```
docker-compose up
```

### Heroku (NOT TESTED!!!!!!!!)

You can easy to deploy redashbot to Heroku, just click following button.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)
