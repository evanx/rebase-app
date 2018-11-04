const createIndex = require('./index.js')
const rtx = require('multi-exec-async')
const redis = require('redis')

const start = async () => {
   const client = redis.createClient()
   await createIndex({
      config: {},
      client,
      context: {},
      replaced: null,
      updated: {}
   })
}

start().catch(err => {
   console.error(err)
})
