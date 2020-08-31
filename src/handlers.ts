import { Middleware, SlackEventMiddlewareArgs } from '@slack/bolt'
import { Redash } from './redash'
import Table from 'table-layout'

type Handler = (ctx: {
  redash: Redash
  capture: (url: string) => Promise<Buffer>
}) => Middleware<SlackEventMiddlewareArgs<'message'>>

export const handleHelp: Middleware<SlackEventMiddlewareArgs<
  'message'
>> = async ({ say }) => {
  say('Sorry, I cannot help you.')
}

export const handleRecordChart: Handler = ({ redash, capture }) => {
  return async ({ context, say, client, message }) => {
    const [originalUrl, queryId, visualizationId]: string[] = context.matches
    await say(`Taking screenshot of ${originalUrl}`)

    const query = await redash.getQuery(queryId)
    const visualization = query.visualizations.find(
      (vis) => vis.id.toString() === visualizationId
    )

    const embedUrl = `${redash.alias}/embed/query/${queryId}/visualization/${visualizationId}?api_key=${redash.apiKey}`
    const filename = `${query.name}-${visualization?.name}-query-${queryId}-visualization-${visualizationId}.png`

    const file = await capture(embedUrl)
    client.files.upload({
      channels: message.channel,
      filename,
      file,
    })
  }
}

export const handleRecordDashboard: Handler = ({ redash, capture }) => {
  return async ({ client, context, say, message }) => {
    const [originalUrl, dashboardId]: string[] = context.matches
    await say(`Taking screenshot of ${originalUrl}`)

    const dashboard = await redash.getDashboard(dashboardId)
    const filename = `${dashboard.name}-dashboard-${dashboardId}.png`
    const file = await capture(dashboard.public_url)
    client.files.upload({
      channels: message.channel,
      filename,
      file,
    })
  }
}

export const handleRecordTable: Handler = ({ redash }) => {
  return async ({ context, say }) => {
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
    say(`${query.name}\n${tableMessage}`)
  }
}
