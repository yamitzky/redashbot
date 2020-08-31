import playwright from 'playwright'
import sleep from 'await-sleep'
import { config } from './config'

const engine = playwright[config.browser]

export async function capture(url: string): Promise<Buffer> {
  const browser = await engine.launch({
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
