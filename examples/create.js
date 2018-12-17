const assert = require('assert')
const rtx = require('multi-exec-async')
const lodash = require('lodash')

const actions = require('../lib/tableActions')
const initDatabaseSchema = require('../lib/initDatabaseSchema')
const exportDatabase = require('../lib/exportDatabase')

const schema = require('./schema')

require('../lib/app')({
  spec: {
    systemKey: 'rebase:test',
    serviceKey: 'examples:delete',
    redis: {
      db: 13
    }
  },
  async start(state) {
    const { client, logger } = state
    initDatabaseSchema(schema)
    client.flushDb()
    const data = {
      id: '1234',
      firstName: 'Evan',
      lastName: 'Summers',
      org: 'test-org',
      group: 'software-development',
      email: 'evan@test-org.com',
      created: new Date(state.timestamp),
      verified: false
    }
    await actions({
      client: state.client,
      schema: schema.user
    }).create(data)
  }
})
