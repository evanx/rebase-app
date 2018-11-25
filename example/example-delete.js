const assert = require('assert')
const bluebird = require('bluebird')
const rtx = require('multi-exec-async')
const redis = require('redis')
const lodash = require('lodash')

const actions = require('../lib/tableActions.js')
const initDatabaseSchema = require('../lib/initDatabaseSchema.js')
const schema = require('./schema')

const state = {}

bluebird.promisifyAll(redis)

const end = async () => {
   state.client.quit()
}

const start = async () => {
   initDatabaseSchema(schema)
   state.client = redis.createClient()
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
   await actions.delete(indexData, {
      client: state.client,
      schema: schema.user
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
