import { App as BoltApp, AppOptions } from '@slack/bolt'
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

export function createApp(config: Config & AppOptions) {
  const app = new BoltApp(config)

  app.message('help', mention(), handleHelp)

  for (const [host, { alias, key: apiKey }] of Object.entries(config.hosts)) {
    const redash = new Redash({ host, apiKey, alias })
    const browser = new Browser()
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

  return app
}
