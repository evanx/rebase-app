const assert = require('assert')
const rtx = require('multi-exec-async')
const redis = require('../redis')
const createLogger = require('../createLogger')

const configureDefault = state => {
   Object.assign(state, {
      timestamp: Date.now(),
      now: () => {
         state.timestamp = Date.now()
         return state.timestamp
      }
   })
}

const configureTesting = state => {
   Object.assign(state, {
      timestamp: 1544000000000,
      now: () => {
         state.timestamp++
         return state.timestamp
      }
   })
}

const getConfig = (config, env) => {
   return Object.assign(
      {
         redis: {
            db: 13
         }
      },
      config
   )
}

const configureService = async ({ redis, config }) => {
   assert(config, 'config')
   assert(config.serviceKey, 'serviceKey')
   const [instanceId, configRes] = await rtx(redis, multi => {
      multi.incr(`${config.serviceKey}:i`)
      multi.hgetallAsync(`config:${config.serviceKey}:h`)
   })
   Object.assign(config, configRes)
   config.serviceId = `${config.serviceKey}:${instanceId}`
}

const end = async state => {
   if (state.redis) {
      state.redis.quit()
   }
}

const filterLines = (string, pattern) =>
   string
      .split('\n')
      .filter(line => line.indexOf(pattern) > 0)
      .join('\n')

module.exports = async ({ config, state, start }) => {
   process.on('unhandledRejection', error => {
      console.error('unhandledRejection', error.message)
      console.error(filterLines(error.stack, 'rebase'))
   })
   try {
      assert(config, 'config')
      assert(state, 'state')
      assert.strictEqual(typeof start, 'function', 'start')
      assert(config.serviceKey, 'serviceKey')
      if (config.testing) {
         configureTesting(state)
      } else {
         configureDefault(state)
      }
      state.config = getConfig(config, process.env)
      state.redis = redis.createClient(state.config.redis)
      await configureService(state)
      state.logger = createLogger(state, { name: state.config.serviceId })
      state.logger.debug('app', {
         status: 'starting',
         serviceId: state.config.serviceId
      })
      await start(state)
   } catch (err) {
      state.logger.error('app', {}, err)
      await end(state)
   }
}
