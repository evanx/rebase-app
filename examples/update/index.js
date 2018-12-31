const assert = require('assert')
const rtx = require('multi-exec-async')
const lodash = require('lodash')

const starter = require('../../lib/app')
const actions = require('../../lib/tableActions')
const initDatabaseSchema = require('../../lib/initDatabaseSchema')
const exportDatabase = require('../../lib/exportDatabase')
const assertDatabase = require('../../lib/assertDatabase')

const schema = require('../schema')

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
      email: 'evan@test.org',
      created: new Date(state.timestamp).toISOString(),
      verified: 'false'
   },
   'user::created:z': ['1234', String(state.timestamp)],
   'user::email:h': {
      'evan@test.org': '1234'
   },
   'user:group::test-org:software-development:s': ['1234']
})

starter({
   config: {
      testing: true,
      systemKey: 'rebase:test',
      serviceKey: 'examples:update',
      redis: {
         db: 13
      }
   },
   state: {
      configureRedis({ redis }) {
         redis.flushdbAsync()
      }
   },
   async start(state) {
      const { redis, logger } = state
      initDatabaseSchema(schema)
      const userRecord = createSampleUserRecord(state)
      const expectedDatabase = createExpectedDatabase(state)
      await actions(state, schema.user).create(userRecord)
      const createdDatabase = await exportDatabase(state, 'user:*')
      logger.info('create', { createdDatabase })
      await actions(state, schema.user).update(userRecord.id, {
         email: 'evan@test.org'
      })
      const updatedDatabase = await exportDatabase(state, 'user:*')
      logger.info('update', { updatedDatabase })
      assertDatabase(updatedDatabase, expectedDatabase)
      const loggerRes = lodash.flattenDeep(
         await redis.xreadAsync('streams', 'logger:examples:update:1:x', '0-0')
      )
      const expectedLoggerStrings = [
         'logger:examples:update:1:x',
         '1544000000001-0',
         'name',
         'examples:update:1',
         'level',
         'info',
         'data'
      ]
      assert.deepStrictEqual(
         loggerRes.slice(0, expectedLoggerStrings.length),
         expectedLoggerStrings,
         'logger'
      )
      return state.end()
   }
})
