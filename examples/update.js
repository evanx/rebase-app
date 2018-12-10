const assert = require('assert')
const bluebird = require('bluebird')
const rtx = require('multi-exec-async')
const redis = require('redis')
const lodash = require('lodash')

const actions = require('../lib/tableActions')
const initDatabaseSchema = require('../lib/initDatabaseSchema')
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
   await actions({
      client: state.client,
      schema: schema.user
   }).create(data)
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
