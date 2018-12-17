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

const getConfig = (spec, env) => {
   return Object.assign(
      {
         redis: {
            db: 13
         }
      },
      spec
   )
}

const configureService = async ({ client, config }) => {
   assert(config, 'config')
   assert(config.serviceKey, 'serviceKey')
   const [instanceId, configRes] = await rtx(client, multi => {
      multi.incr(`${config.serviceKey}:i`)
      multi.hgetallAsync(`config:${config.serviceKey}:h`)
   })
   Object.assign(config, configRes)
   config.serviceId = `${config.serviceKey}:${instanceId}`
}

const end = async state => {
   if (state.client) {
      state.client.quit()
   }
}

module.exports = async ({ spec, start }) => {
   const state = {}
   try {
      assert(spec, 'spec')
      assert(spec.serviceKey, 'serviceKey')
      if (spec.testing) {
         configureTesting(state)
      } else {
         configureDefault(state)
      }
      state.config = getConfig(spec, process.env)
      state.client = redis.createClient(state.config.redis)
      await configureService(state)
      state.logger = createLogger(state, { name: state.config.serviceId })
      state.logger.debug({
         status: 'starting',
         serviceId: state.config.serviceId
      })
      await start(state)
   } catch (err) {
      logger.error(err)
   }
   await end(start)
}
