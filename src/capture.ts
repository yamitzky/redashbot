import playwright, { LaunchOptions } from 'playwright'
import * as lambdaPlaywright from 'playwright-aws-lambda'
import sleep from 'await-sleep'
import { config, Engine } from './config'

const engine = playwright[config.browser]

async function launch(engine: Engine, options?: LaunchOptions) {
  if (engine === 'lambda-chromium') {
    return await lambdaPlaywright.launchChromium(options)
  } else {
    return await playwright[engine].launch(options)
  }
}

export async function capture(url: string): Promise<Buffer> {
  const browser = await launch(config.browser, {
    args: ['--disable-dev-shm-usage', '--no-sandbox'],
  })

  const page = await browser.newPage()
  page.setViewportSize({ width: 1024, height: 360 })
  await page.goto(url)
  try {
    await page.waitForResponse(/.json/, { timeout: config.sleep })
    await sleep(config.sleep)
  } catch {
    //
  }

  const buffer = await page.screenshot({ fullPage: true })
  await browser.close()
  return buffer
}
