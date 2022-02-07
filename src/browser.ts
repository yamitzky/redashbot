import playwright, { LaunchOptions } from 'playwright'
import * as lambdaPlaywright from 'playwright-aws-lambda'
import sleep from 'await-sleep'
import { config, Engine } from './config'

async function launch(engine: Engine, options?: LaunchOptions) {
  if (engine === 'lambda-chromium') {
    return await lambdaPlaywright.launchChromium(options)
  } else {
    return await playwright[engine].launch(options)
  }
}

export class Browser {
  browser: playwright.Browser | null
  options: LaunchOptions

  constructor(options?: LaunchOptions) {
    this.browser = null
    this.options = options || {
      args: ['--disable-dev-shm-usage', '--no-sandbox'],
    }
  }

  async capture(url: string): Promise<Buffer> {
    if (!this.browser) {
      this.browser = await launch(config.browser, this.options)
    }

    const page = await this.browser.newPage()
    page.setViewportSize({ width: 1024, height: 360 })
    await page.goto(url, { timeout: config.browserTimeout })
    try {
      const waitFor = url.includes('/query/') ? /results/ : /events/
      await page.waitForResponse(waitFor, { timeout: config.browserTimeout })
    } catch {
      console.error()
    }
    await sleep(config.sleep)

    const buffer = await page.screenshot({ fullPage: true })
    await page.close()
    return buffer
  }
}
