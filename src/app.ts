import { App as BoltApp, AppOptions } from '@slack/bolt'
import { Browser } from './browser'
import { Config } from './config'
import {
  handleHelp,
  Handler,
  handleRecordChart,
  handleRecordDashboard,
  handleRecordDashboardLegacy,
  handleRecordTable,
} from './handlers'
import { mention } from './middleware'
import { Redash } from './redash'

const handlers: [path: string, handler: Handler][] = [
  [`/queries/([0-9]+)#([0-9]+)`, handleRecordChart],
  [`/dashboard/([^?/|>]+)`, handleRecordDashboardLegacy],
  [`/dashboards/(\\d+)-([^?/|>]+)`, handleRecordDashboard],
  [`/queries/([0-9]+)#table`, handleRecordTable],
  [`/queries/([0-9]+)>?$`, handleRecordTable],
]

export function createApp(config: Config & AppOptions) {
  const app = new BoltApp(config)

  app.message('help', mention(), handleHelp)

  const browser = new Browser()
  for (const [host, { alias, key: apiKey }] of Object.entries(config.hosts)) {
    const redash = new Redash({ host, apiKey, alias })
    const ctx = { redash, browser }
    for (const [path, handler] of handlers) {
      app.message(new RegExp(`${host}${path}`), mention(), handler(ctx))
    }
  }

  app.command('/redash-capture', async (args) => {
    const { ack } = args
    await ack()

    for (const [host, { alias, key: apiKey }] of Object.entries(config.hosts)) {
      const redash = new Redash({ host, apiKey, alias })
      const ctx = { redash, browser }
      for (const [path, handler] of handlers) {
        const { command } = args
        const matches = new RegExp(`${host}${path}`).exec(command.text)
        if (matches) {
          await handler(ctx)({
            ...args,
            context: {
              ...args.context,
              matches: matches,
            },
            message: { channel: command.channel_id },
          })
        }
      }
    }
  })

  return app
}
