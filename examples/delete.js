const assert = require('assert')
const lodash = require('lodash')
const rtx = require('multi-exec-async')
const redis = require('../lib/redis')
const logger = require('../lib/logger')
const actions = require('../lib/tableActions')
const initDatabaseSchema = require('../lib/initDatabaseSchema')
const schema = require('./schema')
const exportDatabase = require('../lib/exportDatabase')
const assertDatabase = require('../lib/assertDatabase')

const state = {
   timestamp: 1544000000000,
}

Object.assign(state, {
   now: () => state.timestamp++,
})

const data = {
   id: '1234',
   firstName: 'Evan',
   lastName: 'Summers',
   org: 'test-org',
   group: 'software-development',
   email: 'evan@test-org.com',
   updated: new Date(state.timestamp),
   verified: false,
}

const expectedDatabase = {
   'user:1234:h': {
      id: '1234',
      firstName: 'Evan',
      lastName: 'Summers',
      org: 'test-org',
      group: 'software-development',
      email: 'evan@test-org.com',
      updated: new Date(state.timestamp).toISOString(),
      verified: 'false',
   },
   'user::updated:z': ['1234', String(state.timestamp)],
   'user::email:h': {
      'evan@test-org.com': '1234',
   },
   'user:group::test-org:software-development:s': ['1234'],
}

const end = async () => {
   state.redis.quit()
}

const getConfigEnv = env => {
   return {
      systemKey: 'rebase:test',
      clientKey: 'examples:delete',
      redis: {
         db: 13,
      },
   }
}

const configureClient = async ({ redis, config }) => {
   const [instanceId, configRes] = await rtx(redis, multi => {
      multi.incr(`${config.clientKey}:i`)
      multi.hgetallAsync(`config:${config.clientKey}`)
   })
   Object.assign(config, configRes)
   config.serviceId = `${config.clientKey}:${instanceId}`
}

const start = async () => {
   state.config = getConfigEnv(process.env)
   state.redis = redis.createClient(state.config.redis)
   state.redis.flushdb()
   await configureClient(state)
   const logger = logger(state)({ name: 'delete' })
   logger.debug({
      status: 'starting',
      serviceId: state.config.serviceId,
   })
   initDatabaseSchema({ logger }, schema)
   const initialDatabase = await exportDatabase(state, 'user:*')
   const indexData = lodash.pick(data, schema.indexFields)
   await actions(state, schema.user).create(data)
   const resultDatabase = await exportDatabase(state, 'user:*')
   logger.info({ resultDatabase })
   assertDatabase(resultDatabase, expectedDatabase)
   await actions(state, schema.user).delete(indexData)
   await rtx(state.redis, multi => {
      multi.del('l:examples:delete:1:x')
   })
   const finalDatabase = await exportDatabase(state, 'user:*')
   assert.deepStrictEqual(initialDatabase, finalDatabase, 'final database')
   await rtx(state.redis, multi => {
      multi.del('examples:delete:i')
   })
}

start()
   .then(() => {
      console.log('end')
      return end()
   })
   .catch(err => {
      console.error(err)
      return end()
   })
