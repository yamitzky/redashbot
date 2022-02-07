import { App as BoltApp, AppOptions, LogLevel, WorkflowStep } from '@slack/bolt'
import { Browser } from './browser'
import { Config } from './config'
import {
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

  const ws = new WorkflowStep('redash_capture', {
    edit: async ({ ack, step, configure, ...args }) => {
      await ack()

      const { inputs } = step
      const blocks = [
        {
          type: 'input',
          block_id: 'url_input',
          element: {
            type: 'plain_text_input',
            action_id: 'url',
            initial_value: inputs.url?.value,
            placeholder: {
              type: 'plain_text',
              text: `https://${Object.keys(config.hosts)[0]}/queries/...`,
            },
          },
          label: {
            type: 'plain_text',
            text: 'URL to Capture',
          },
        },
        {
          type: 'input',
          block_id: 'channel_input',
          element: {
            type: 'channels_select',
            action_id: 'channel',
            // initial_channel: inputs.channel.value,
            placeholder: {
              type: 'plain_text',
              text: 'general',
            },
          },
          label: {
            type: 'plain_text',
            text: 'Channel to Post',
          },
        },
      ]

      await configure({ blocks })
    },
    save: async ({ ack, view, update }) => {
      await ack()

      const { values } = view.state
      const url = values.url_input.url
      const channel = values.channel_input.channel

      const inputs = {
        url: { value: url.value },
        channel: { value: channel.selected_channel },
      }

      const outputs = [
        {
          type: 'text',
          name: 'url',
          label: 'URL to Capture',
        },
        {
          type: 'text',
          name: 'channel',
          label: 'Channel to Capture',
        },
      ]

      await update({ inputs, outputs })
    },
    execute: async (args) => {
      const { step, complete } = args
      const { inputs } = step

      const url = inputs.url.value
      const channel = inputs.channel.value

      for (const [host, { alias, key: apiKey }] of Object.entries(
        config.hosts
      )) {
        const redash = new Redash({ host, apiKey, alias })
        const ctx = { redash, browser }
        for (const [path, handler] of handlers) {
          const matches = new RegExp(`${host}${path}`).exec(url)
          if (matches) {
            await handler(ctx)({
              ...args,
              context: {
                ...args.context,
                matches: matches,
              },
              message: { channel },
            })
          }
        }
      }

      const outputs = { url, channel }
      await complete({ outputs })
    },
  })
  app.step(ws)

  // @ts-expect-error
  app.error((error) => {
    console.error(error)
  })

  return app
}
