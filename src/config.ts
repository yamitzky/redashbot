export type Engine = 'chromium' | 'firefox' | 'webkit' | 'lambda-chromium'
type Hosts = {
  [host: string]: {
    alias: string
    key: string
  }
}
export type Config = {
  port: number
  token: string
  signingSecret: string
  appToken?: string
  socketMode?: boolean
  hosts: Hosts
  browser: Engine
  sleep: number
  browserTimeout: number
  headers?: Record<string, any>
}

let hosts: Hosts
if (process.env.REDASH_HOST) {
  if (process.env.REDASH_HOST_ALIAS) {
    hosts = {
      [process.env.REDASH_HOST!]: {
        alias: process.env.REDASH_HOST_ALIAS!,
        key: process.env.REDASH_API_KEY!,
      },
    }
  } else {
    hosts = {
      [process.env.REDASH_HOST!]: {
        alias: process.env.REDASH_HOST!,
        key: process.env.REDASH_API_KEY!,
      },
    }
  }
} else {
  hosts = (process.env.REDASH_HOSTS_AND_API_KEYS || '').split(',').reduce(
    (m, host_and_key) => {
      let [host, alias, key] = host_and_key.split(';')
      if (!key) {
        key = alias
        alias = host
      }
      m[host] = { alias, key }
      return m
    },
    {} as Record<string, { alias: string; key: string }>,
  )
}

const headers: Record<string, string> = {}
try {
  if (process.env.REDASH_CUSTOM_HEADERS) {
    for (const kv of process.env.REDASH_CUSTOM_HEADERS.split(';')) {
      const [header, value] = kv.split(':', 2)
      headers[header] = value
    }
  }
} catch (error) {
  console.warn('Failed to parse REDASH_CUSTOM_HEADERS:', error)
}

export const config: Config = {
  token: process.env.SLACK_BOT_TOKEN!,
  signingSecret: process.env.SLACK_SIGNING_SECRET!,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: process.env.SLACK_SOCKET_MODE === 'true',
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  browser: (process.env.BROWSER || 'chromium') as Engine,
  sleep: process.env.SLEEP_TIME ? parseFloat(process.env.SLEEP_TIME) : 1000,
  browserTimeout: process.env.BROWSER_TIMEOUT
    ? parseFloat(process.env.BROWSER_TIMEOUT)
    : process.env.SLEEP_TIME
      ? parseFloat(process.env.SLEEP_TIME)
      : 10000,
  hosts,
  headers,
}
