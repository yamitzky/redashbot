import {
  Middleware,
  SlackEventMiddlewareArgs,
  ContextMissingPropertyError,
} from '@slack/bolt'

// Original: https://github.com/slackapi/bolt-js/blob/f8c25ffb5cd91827510bbc689e97556d2d5ad017/src/middleware/builtin.ts#L327
// Currently, Bolt's official directMention does not support reminder mention.
const slackLink = /<(?<type>[@#!])?(?<link>[^>|]+)(?:\|(?<label>[^>]+))?>/
export function mention(): Middleware<SlackEventMiddlewareArgs<'message'>> {
  return async ({ message, context, next }) => {
    if (context.botUserId === undefined) {
      throw new ContextMissingPropertyError(
        'botUserId',
        'Cannot match direct mentions of the app without a bot user ID. Ensure authorize callback returns a botUserId.'
      )
    }

    if (!('text' in message) || message.text === undefined) {
      return
    }

    const text = message.text.trim()
    const matches = slackLink.exec(text)
    if (
      matches?.groups?.type !== '@' ||
      matches?.groups?.link !== context.botUserId
    ) {
      return
    }

    await next!()
  }
}
