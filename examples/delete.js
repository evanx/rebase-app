const assert = require('assert')
const bluebird = require('bluebird')
const rtx = require('multi-exec-async')
const redis = require('redis')
const lodash = require('lodash')
const logger = require('pino')({ name: 'delete', level: 'debug' })

const actions = require('../lib/tableActions')
const initDatabaseSchema = require('../lib/initDatabaseSchema')
const schema = require('./schema')
const exportDatabase = require('../lib/exportDatabase')

const state = {}

bluebird.promisifyAll(redis)

const end = async () => {
   state.client.quit()
}

const start = async () => {
   initDatabaseSchema(schema)
   state.client = redis.createClient({ db: 13 })
   state.client.flushdb()
   const initialDatabase = await exportDatabase(state)
   const data = {
      id: '1234',
      firstName: 'Evan',
      lastName: 'Summers',
      org: 'test-org',
      group: 'software-development',
      email: 'evan@test-org.com',
      created: new Date(),
      verified: false
   }
   const indexData = lodash.pick(data, schema.indexFields)
   await actions({
      client: state.client,
      schema: schema.user
   }).create(data)
   const resultDatabase = await exportDatabase(state)
   await actions({
      client: state.client,
      schema: schema.user
   }).delete(indexData)
   const finalDatabase = await exportDatabase(state)
   logger.debug({ resultDatabase })
   assert.deepStrictEqual(initialDatabase, finalDatabase, 'database')
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
