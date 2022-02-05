import { Context, Middleware as M, SlackEventMiddlewareArgs } from '@slack/bolt'
import { Redash } from './redash'
import Table from 'table-layout'
import { Browser } from './browser'
import { WebClient } from '@slack/web-api'

type Middleware = (args: {
  context: Context
  client: WebClient
  message: { channel: string }
}) => Promise<void>

export type Handler = (ctx: { redash: Redash; browser: Browser }) => Middleware

export const handleRecordChart: Handler = ({ redash, browser }) => {
  return async ({ context, client, message }) => {
    const [originalUrl, queryId, visualizationId]: string[] = context.matches
    await client.chat.postMessage({
      text: `Taking screenshot of ${originalUrl}`,
      channel: message.channel,
    })

    const query = await redash.getQuery(queryId)
    const visualization = query.visualizations.find(
      (vis) => vis.id.toString() === visualizationId
    )

    const embedUrl = `${redash.alias}/embed/query/${queryId}/visualization/${visualizationId}?api_key=${redash.apiKey}`
    const filename = `${query.name}-${visualization?.name}-query-${queryId}-visualization-${visualizationId}.png`

    const file = await browser.capture(embedUrl)
    client.files.upload({
      channels: message.channel,
      filename,
      file,
    })
  }
}

export const handleRecordDashboardLegacy: Handler = ({ redash, browser }) => {
  return async ({ client, context, message }) => {
    const [originalUrl, dashboardSlug]: string[] = context.matches
    await client.chat.postMessage({
      text: `Taking screenshot of ${originalUrl}`,
      channel: message.channel,
    })

    const dashboard = await redash.getDashboardLegacy(dashboardSlug)
    const filename = `${dashboard.name}-dashboard-${dashboardSlug}.png`
    const file = await browser.capture(dashboard.public_url)
    client.files.upload({
      channels: message.channel,
      filename,
      file,
    })
  }
}

export const handleRecordDashboard: Handler = ({ redash, browser }) => {
  return async ({ client, context, message }) => {
    const [originalUrl, dashboardId, dashboardSlug]: string[] = context.matches
    await client.chat.postMessage({
      text: `Taking screenshot of ${originalUrl}`,
      channel: message.channel,
    })

    const dashboard = await redash.getDashboard(dashboardId)
    const filename = `${dashboard.name}-dashboard-${dashboardId}-${dashboardSlug}.png`
    if (dashboard.public_url) {
      const file = await browser.capture(dashboard.public_url)
      client.files.upload({
        channels: message.channel,
        filename,
        file,
      })
    } else {
      await client.chat.postMessage({
        text: `ERROR: ${originalUrl} is not publihed.`,
        channel: message.channel,
      })
    }
  }
}

export const handleRecordTable: Handler = ({ redash }) => {
  return async ({ context, client, message }) => {
    const [originalUrl, queryId]: string[] = context.matches
    const query = await redash.getQuery(queryId)
    const result = (await redash.getQueryResult(queryId)).query_result.data

    const rows = result.rows.map((row) => {
      const converted: Record<string, any> = {}
      for (const { friendly_name, name } of result.columns) {
        converted[friendly_name] = row[name]
      }
      return converted
    })

    const cols: Record<string, string> = {}
    for (const { friendly_name } of result.columns) {
      const dashes = '-'.repeat(friendly_name.length)
      cols[friendly_name] = `${friendly_name}\n${dashes}`
    }
    const table = new Table([cols].concat(rows))
    let tableMessage = '```' + table.toString() + '```'
    tableMessage = tableMessage
      .split('\n')
      .map((line) => line.trimRight())
      .join('\n')
    await client.chat.postMessage({
      text: `${query.name}\n${tableMessage}`,
      channel: message.channel,
    })
  }
}
