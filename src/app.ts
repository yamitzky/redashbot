import {
  AllMiddlewareArgs,
  App as BoltApp,
  AppOptions,
  Middleware,
  SlackCommandMiddlewareArgs,
} from '@slack/bolt'
import {
  handleRecordChart,
  handleRecordDashboard,
  handleRecordDashboardLegacy,
  handleRecordTable,
  handleHelp,
} from './handlers'
import { Redash } from './redash'
import { Browser } from './browser'
import { Config } from './config'
import { mention } from './middleware'

async function subcommand(
  cmd: RegExp,
  args: SlackCommandMiddlewareArgs & AllMiddlewareArgs,
  middleware: Middleware<any>
) {
  const { command } = args
  const matches = cmd.exec(command.text)
  if (matches) {
    await middleware({
      ...args,
      context: {
        ...args.context,
        matches: matches,
      },
      message: { channel: command.channel_id },
    })
  }
}

export function createApp(config: Config & AppOptions) {
  const app = new BoltApp(config)

  app.message('help', mention(), handleHelp)

  const browser = new Browser()
  for (const [host, { alias, key: apiKey }] of Object.entries(config.hosts)) {
    const redash = new Redash({ host, apiKey, alias })
    const ctx = { redash, browser }
    app.message(
      new RegExp(`${host}/queries/([0-9]+)#([0-9]+)`),
      mention(),
      handleRecordChart(ctx)
    )
    app.message(
      new RegExp(`${host}/dashboard/([^?/|>]+)`),
      mention(),
      handleRecordDashboardLegacy(ctx)
    )
    app.message(
      new RegExp(`${host}/dashboards/(\\d+)-([^?/|>]+)`),
      mention(),
      handleRecordDashboard(ctx)
    )
    app.message(
      new RegExp(`${host}/queries/([0-9]+)#table`),
      mention(),
      handleRecordTable(ctx)
    )
    app.message(
      new RegExp(`${host}/queries/([0-9]+)>?$`),
      mention(),
      handleRecordTable(ctx)
    )
  }

  app.command('/redash-capture', async (args) => {
    const { ack } = args
    await ack()

    for (const [host, { alias, key: apiKey }] of Object.entries(config.hosts)) {
      const redash = new Redash({ host, apiKey, alias })
      const ctx = { redash, browser }
      await subcommand(
        new RegExp(`${host}/queries/([0-9]+)#([0-9]+)`),
        args,
        handleRecordChart(ctx)
      )
      await subcommand(
        new RegExp(`${host}/dashboard/([^?/|>]+)`),
        args,
        handleRecordDashboardLegacy(ctx)
      )
      await subcommand(
        new RegExp(`${host}/dashboards/(\\d+)-([^?/|>]+)`),
        args,
        handleRecordDashboard(ctx)
      )
      await subcommand(
        new RegExp(`${host}/queries/([0-9]+)#table`),
        args,
        handleRecordTable(ctx)
      )
      await subcommand(
        new RegExp(`${host}/queries/([0-9]+)>?$`),
        args,
        handleRecordTable(ctx)
      )
    }
  })

  return app
}
