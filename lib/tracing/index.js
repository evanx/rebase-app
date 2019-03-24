const assert = require('assert')
const colors = require('colors/safe')
const lodash = require('lodash')
const { sendCommand } = require('@evanx/redis-async')

const standardSerializers = require('../serializers')

const flattenStringifyEntries = object =>
   lodash.flatten(
      Object.entries(object).map(([key, value]) =>
         typeof value === 'object'
            ? [key, JSON.stringify(value)]
            : [key, value],
      ),
   )

const themes = {
   dark: {
      error: 'red',
      warn: 'yellow',
      info: 'blue',
      debug: 'magenta',
   },
}

module.exports = app => {
   const { redis, config, now, subscriptions } = app
   assert(now, 'now')
   // declare
   const levelColors = themes.dark
   //
   const mergeContext = (parentContext, childContext) => {
      return Object.assign(
         {
            serializers: standardSerializers,
         },
         parentContext,
         childContext,
      )
   }
   //
   const hincrbyAsync = (field, by) =>
      redis.hincrbyAsync(`logger:${config.serviceId}:h`, field, by)
   //
   const createChild = context => {
      context = Object.assign(
         {
            serializers: standardSerializers,
         },
         context,
      )
      const { name, serializers } = context
      assert.strictEqual(typeof name, 'string', 'name')
      assert.strictEqual(typeof serializers, 'object', `${name}:serializers`)
      assert.strictEqual(
         typeof serializers.err,
         'function',
         `${name}:serializers.err`,
      )
      //
      const createFn = level => (vars, msg) => {
         const timestamp = now()
         vars = Object.keys(vars).reduce(
            (result, key) => {
               const serializer = serializers[key]
               const value = vars[key]
               if (value && serializer && typeof serializer === 'function') {
                  result[key] = serializer(value)
               } else if (value !== undefined) {
                  result[key] = value
               }
               return result
            },
            { msg },
         )
         //
         if (subscriptions) {
            const { topics, pubsub } = subscriptions
            pubsub.publish(topics.LOGGER_CHANGED, {
               loggerChanged: {
                  name,
                  timestamp,
                  level,
                  vars: JSON.stringify(vars),
               },
            })
         }
         //
         const print = vars =>
            console.log(
               colors.gray(new Date(timestamp).toISOString()),
               colors.cyan(name),
               colors[levelColors[level]](level),
               JSON.stringify(vars, null, 2),
            )
         if (vars.err) {
            if (vars.err instanceof Error) {
               console.error(`Logger ${name}`, error.stack)
            } else {
               console.error(`Logger ${name}: typeof vars.err`, typeof vars.err)
            }
         }
         print(vars)
         //
         const command = [
            'xadd',
            `logger:${config.serviceId}:x`,
            `${timestamp}-0`,
            'name',
            name,
            'level',
            level,
            'vars',
            JSON.stringify(vars),
         ]
         sendCommand(redis, ...command).catch(err => {
            console.log(
               err,
               JSON.stringify({ name, level, timestamp }, null, 2),
            )
         })
         //
         if (vars.increment) {
            hincrbyAsync(vars.increment, 1)
         }
         hincrbyAsync(level, 1)
      }
      //
      const logger = ['error', 'warn', 'info', 'debug'].reduce(
         (logger, level) => {
            logger[level] = createFn(level)
            return logger
         },
         {
            child: childContext =>
               createChild(mergeContext(context, childContext)),
         },
      )
      logger.info({ context })
      return logger
   }
   //
   return createChild
}
