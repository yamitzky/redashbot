import { App, ExpressReceiver } from '@slack/bolt'
import { createApp } from './src/app'
import { config } from './src/config'

const receiver = new ExpressReceiver({
  signingSecret: config.signingSecret,
})

const app = createApp({ ...config, receiver })

receiver.router.get('/', (_, res) => {
  res.send('ok')
})
;(async () => {
  // Start your app
  await app.start(config.port)
  console.log(`⚡️ Bolt app is running @ ${config.port}!`)
})()
