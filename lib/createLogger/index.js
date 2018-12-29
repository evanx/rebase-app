const assert = require('assert')
const colors = require('colors/safe')
const lodash = require('lodash')

const flattenStringifyEntries = object =>
   lodash.flatten(
      Object.entries(object).map(([key, value]) =>
         typeof value === 'object' ? [key, JSON.stringify(value)] : [key, value]
      )
   )

const themes = {
   dark: {
      error: 'red',
      warn: 'yellow',
      info: 'blue',
      debug: 'magenta',
      metric: 'blue'
   }
}

module.exports = ({ redis, config, now, subscriptions }, { name }) => {
   assert(now, 'now')
   assert(name, 'name')
   const methodColors = themes.dark
   //
   const createMethod = method => (id, data = {}, error = null) => {
      assert.strictEqual(typeof id, 'string')
      // local assignments
      const level = ['error', 'warn', 'info'].includes(method)
         ? method
         : 'debug'
      const timestamp = now()
      //
      if (subscriptions) {
         const { topics, pubsub } = subscriptions
         pubsub.publish(topics.LOGGER_CHANGED, {
            loggerChanged: {
               name,
               timestamp,
               id,
               method,
               data: JSON.stringify(data),
               error:
                  error &&
                  JSON.stringify({
                     code: error.code,
                     name: error.name,
                     message: error.message
                  })
            }
         })
      }
      //
      const print = info =>
         console.log(
            colors.gray(new Date(timestamp).toISOString().substring(0, 19)),
            colors.cyan(name),
            colors[methodColors[method]](method),
            colors.blue(id),
            info
         )
      if (error) {
         if (error instanceof Error) {
            print(error)
         } else {
            console.warn('WARNING: typeof error', typeof error)
         }
      }
      if (data instanceof Error) {
         print(data)
         console.warn('WARNING: data error')
      } else {
         print(JSON.stringify(data, null, 2))
      }
      //
      redis
         .xaddAsync(
            `logger:${config.serviceId}:x`,
            `${timestamp}-1`,
            ...flattenStringifyEntries({ name, level, data })
         )
         .catch(err => {
            console.log(
               JSON.stringify({ name, level, timestamp, data, err }, null, 2)
            )
         })
      //
      const hincrbyAsync = (field, by) =>
         redis.hincrbyAsync(`logger:${config.serviceId}:h`, field, by)
      if (method === 'metric') {
         if (data.action === 'increment') {
            hincrbyAsync(id, 1)
         }
      } else {
         hincrbyAsync(method, 1)
      }
   }
   //
   return ['error', 'warn', 'info', 'debug', 'metric'].reduce(
      (logger, method) => {
         logger[method] = createMethod(method)
         return logger
      },
      {}
   )
}
