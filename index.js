"use strict"

const Botkit = require("botkit")
const puppeteer = require("puppeteer")
const tempfile = require("tempfile")
const fs = require("fs")
const request = require('request-promise-native')
const sleep = require('await-sleep')
const Table = require('table-layout')


// This configuration can gets overwritten when process.env.SLACK_MESSAGE_EVENTS is given.
const DEFAULT_SLACK_MESSAGE_EVENTS = "direct_message,direct_mention,mention"

if (!process.env.SLACK_BOT_TOKEN) {
  console.error("Error: Specify SLACK_BOT_TOKEN in environment values")
  process.exit(1)
}
if (!((process.env.REDASH_HOST && process.env.REDASH_API_KEY) || (process.env.REDASH_HOSTS_AND_API_KEYS))) {
  console.error("Error: Specify REDASH_HOST and REDASH_API_KEY in environment values")
  console.error("Or you can set multiple Re:dash configs by specifying like below")
  console.error("REDASH_HOSTS_AND_API_KEYS=\"http://redash1.example.com;TOKEN1,http://redash2.example.com;TOKEN2\"")
  process.exit(1)
}

const parseApiKeysPerHost = () => {
  if (process.env.REDASH_HOST) {
    if (process.env.REDASH_HOST_ALIAS) {
      return {[process.env.REDASH_HOST]: {"alias": process.env.REDASH_HOST_ALIAS, "key": process.env.REDASH_API_KEY}}
    } else {
      return {[process.env.REDASH_HOST]: {"alias": process.env.REDASH_HOST, "key": process.env.REDASH_API_KEY}}
    }
  } else {
    return process.env.REDASH_HOSTS_AND_API_KEYS.split(",").reduce((m, host_and_key) => {
      var [host, alias, key] = host_and_key.split(";")
      if (!key) {
        key = alias
        alias = host
      }
      m[host] = {"alias": alias, "key": key}
      return m
    }, {})
  }
}

const redashApiKeysPerHost = parseApiKeysPerHost()
const slackBotToken = process.env.SLACK_BOT_TOKEN
const slackMessageEvents = process.env.SLACK_MESSAGE_EVENTS || DEFAULT_SLACK_MESSAGE_EVENTS

const controller = Botkit.slackbot({
  debug: !!process.env.DEBUG
})

controller.spawn({
  token: slackBotToken
}).startRTM()

const faultTolerantMiddleware = (func) => {
  return async (bot, message) => {
    try {
      await func(bot, message)
      bot.botkit.log("ok")
    } catch (err) {
      const msg = `Something wrong happend : ${err}`
      bot.reply(message, msg)
      bot.botkit.log.error(msg)
    }
  }
}

const takeScreenshot = async (url) => {
  const file = tempfile(".png")
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROMIUM_BROWSER_PATH,
    args: ['--disable-dev-shm-usage', '--no-sandbox']
  })
  const page = await browser.newPage()
  page.setViewport({ width: 1024, height: 360 })
  await page.goto(url)
  await sleep(process.env.SLEEP_TIME ? parseFloat(process.env.SLEEP_TIME) : 2000)
  await page.screenshot({ path: file, fullPage: true })
  await browser.close()
  return file
}

const uploadFile = async (channel, filename, file) => {
  const options = {
    token: slackBotToken,
    filename: filename,
    file: fs.createReadStream(file),
    channels: channel
  }
  await request.post({ url: "https://api.slack.com/api/files.upload", formData: options, simple: true })
}

Object.keys(redashApiKeysPerHost).forEach((redashHost) => {
  const redashHostAlias = redashApiKeysPerHost[redashHost]["alias"]
  const redashApiKey    = redashApiKeysPerHost[redashHost]["key"]

  controller.hears(`${redashHost}/queries/([0-9]+)#([0-9]+)`, slackMessageEvents, faultTolerantMiddleware(async (bot, message) => {
    const [ originalUrl, queryId, visualizationId ] = message.match

    const body = await request.get({ uri: `${redashHost}/api/queries/${queryId}`, qs: { api_key: redashApiKey }, simple: true })
    const query = JSON.parse(body)
    const visualization = query.visualizations.find(vis => vis.id.toString() === visualizationId)

    const embedUrl = `${redashHostAlias}/embed/query/${queryId}/visualization/${visualizationId}?api_key=${redashApiKey}`
    const filename = `${query.name}-${visualization.name}-query-${queryId}-visualization-${visualizationId}.png`

    bot.reply(message, `Taking screenshot of ${originalUrl}`)
    bot.botkit.log(embedUrl)
    const output = await takeScreenshot(embedUrl)
    uploadFile(message.channel, filename, output)
  }))

  controller.hears(`${redashHost}/dashboard/([^?/|>]+)`, slackMessageEvents, faultTolerantMiddleware(async (bot, message) => {
    const [ originalUrl, dashboardId ] = message.match

    const body = await request.get({ uri: `${redashHost}/api/dashboards/${dashboardId}`, qs: { api_key: redashApiKey }, simple: true })
    const dashboard = JSON.parse(body)

    const filename = `${dashboard.name}-dashboard-${dashboardId}.png`

    bot.reply(message, `Taking screenshot of ${originalUrl}`)
    bot.botkit.log(dashboard.public_url)
    const output = await takeScreenshot(dashboard.public_url)
    uploadFile(message.channel, filename, output)
  }))

  controller.hears(`${redashHost}/queries/([0-9]+)(?:#table)?`, slackMessageEvents, faultTolerantMiddleware(async (bot, message) => {
    const [ originalUrl, queryId ] = message.match
    const body = await request.get({ uri: `${redashHost}/api/queries/${queryId}`, qs: { api_key: redashApiKey }, simple: true })
    const query = JSON.parse(body)

    const result = JSON.parse(await request.get({ uri: `${redashHost}/api/queries/${queryId}/results.json`, qs: { api_key: redashApiKey }, simple: true })).query_result.data

    const rows = result.rows.map(row => {
      const converted = {}
      for (const { friendly_name, name } of result.columns) {
        converted[friendly_name] = row[name]
      }
      return converted
    })

    const cols = {}
    for (const { friendly_name } of result.columns) {
      const dashes = '-'.repeat(friendly_name.length)
      cols[friendly_name] = `${friendly_name}\n${dashes}`
    }
    const table = new Table([cols].concat(rows))
    let tableMessage = '```' + table.toString() + '```'
    tableMessage = tableMessage.split('\n').map(line => line.trimRight()).join('\n')
    bot.reply(message, `${query.name}\n${tableMessage}`)
  }))
})
