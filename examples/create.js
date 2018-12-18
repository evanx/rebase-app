const assert = require('assert')
const rtx = require('multi-exec-async')
const lodash = require('lodash')

const actions = require('../lib/tableActions')
const initDatabaseSchema = require('../lib/initDatabaseSchema')
const exportDatabase = require('../lib/exportDatabase')
const assertDatabase = require('../lib/assertDatabase')

const schema = require('./schema')

const createSampleUserRecord = state => ({
  id: '1234',
  firstName: 'Evan',
  lastName: 'Summers',
  org: 'test-org',
  group: 'software-development',
  email: 'evan@test-org.com',
  created: new Date(state.timestamp),
  verified: false
})

const createExpectedDatabase = state => ({
  'user:1234:h': {
    id: '1234',
    firstName: 'Evan',
    lastName: 'Summers',
    org: 'test-org',
    group: 'software-development',
    email: 'evan@test-org.com',
    created: new Date(state.timestamp).toISOString(),
    verified: 'false' // TODO: Parse to boolean
  },
  'user::created:z': ['1234', String(state.timestamp)],
  'user::email:h': {
    'evan@test-org.com': '1234'
  },
  'user:group::test-org:software-development:s': ['1234']
})

require('../lib/app')({
  spec: {
    testing: true,
    systemKey: 'rebase:test',
    serviceKey: 'examples:create',
    redis: {
      db: 13
    }
  },
  async start(state) {
    const { client, logger } = state
    initDatabaseSchema(schema)
    client.flushdbAsync()
    const userRecord = createSampleUserRecord(state)
    const expectedDatabase = createExpectedDatabase(state)
    await actions({
      client: state.client,
      schema: schema.user
    }).create(userRecord)
    const resultDatabase = await exportDatabase(state, 'user:*')
    logger.info({ resultDatabase })
    assertDatabase(resultDatabase, expectedDatabase)
  }
})
