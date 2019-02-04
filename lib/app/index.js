const assert = require('assert')
const rtx = require('multi-exec-async')
const redis = require('../redis')
const tracing = require('../tracing')

const configureDefault = state => {
   Object.assign(state, {
      timestamp: Date.now(),
      now: () => {
         state.timestamp = Date.now()
         return state.timestamp
      },
   })
}

const configureTesting = state => {
   Object.assign(state, {
      timestamp: 1544000000000,
      now: () => {
         state.timestamp++
         return state.timestamp
      },
   })
}

const configureEnv = (config, env) => {
   assert.strictEqual(typeof config.redis, 'object', 'redis')
   assert.strictEqual(typeof config.redis.db, 'number', 'redis.db')
   return Object.assign({}, config)
}

const configureService = async ({ redis, config }) => {
   assert(config, 'config')
   assert(config.serviceKey, 'serviceKey')
   const [instanceId, configRes] = await rtx(redis, multi => {
      multi.incr(`${config.serviceKey}:i`)
      multi.hgetallAsync(`config:${config.serviceKey}:h`)
   })
   return Object.assign(config, configRes, {
      serviceId: `${config.serviceKey}:${instanceId}`,
   })
}

const filterLines = (string, pattern) =>
   string
      .split('\n')
      .filter(line => line.indexOf(pattern) > 0)
      .join('\n')

module.exports = async ({ config, state, start }) => {
   state.end = async () => {
      if (state.redis) {
         state.redis.quit()
      }
   }
   process.on('unhandledRejection', error => {
      console.error('unhandledRejection', error.message)
      console.error(filterLines(error.stack, 'rebase'))
   })
   try {
      assert.strictEqual(typeof config, 'object', 'config')
      assert.strictEqual(typeof config.serviceKey, 'string', 'serviceKey')
      assert.strictEqual(typeof state, 'object', 'state')
      assert.strictEqual(typeof start, 'function', 'start')
      if (config.testing) {
         configureTesting(state)
      } else {
         configureDefault(state)
      }
      state.config = configureEnv(config, process.env)
      state.redis = redis.createClient(state.config.redis)
      if (state.configureRedis) {
         state.configureRedis(state)
      }
      await configureService(state)
      state.logger = tracing(state)({ name: state.config.serviceId })
      state.logger.info({
         status: 'starting',
         serviceId: state.config.serviceId,
      })
      if (!state.publish) {
         state.publish = (multi, info) => state.logger.info(info, 'publish')
      }
      await start(state)
   } catch (err) {
      if (state.logger) {
         state.logger.error({ err }, 'app')
      } else {
         console.error(err)
      }
      state.end()
   }
}
