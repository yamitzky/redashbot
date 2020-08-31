import { createApp } from './src/app'
import { config } from './src/config'
import { ExpressReceiver } from '@slack/bolt'
import awsServerlessExpress from 'aws-serverless-express'

const expressReceiver = new ExpressReceiver({
  signingSecret: config.signingSecret,
  processBeforeResponse: true,
})
createApp({ ...config, processBeforeResponse: true })

const server = awsServerlessExpress.createServer(expressReceiver.app)
export const app = (event, context) => {
  awsServerlessExpress.proxy(server, event, context)
}
