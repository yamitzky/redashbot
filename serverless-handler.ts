import serverlessExpress from '@codegenie/serverless-express'
import { ExpressReceiver } from '@slack/bolt'
import { createApp } from './src/app'
import { config } from './src/config'

const expressReceiver = new ExpressReceiver({
  signingSecret: config.signingSecret,
  processBeforeResponse: true,
})
createApp({ ...config, processBeforeResponse: true })

let serverlessExpressInstance

async function setup(event, context) {
  serverlessExpressInstance = serverlessExpress({ app: expressReceiver.app })
  return serverlessExpressInstance(event, context)
}

export function app(event, context) {
  if (serverlessExpressInstance) {
    return serverlessExpressInstance(event, context)
  }

  return setup(event, context)
}
