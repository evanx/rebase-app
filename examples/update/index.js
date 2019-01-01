const assert = require('assert')
const rtx = require('multi-exec-async')
const lodash = require('lodash')

const starter = require('../../lib/app')
const actions = require('../../lib/tableActions')
const initDatabaseSchema = require('../../lib/initDatabaseSchema')
const exportDatabase = require('../../lib/exportDatabase')
const assertDatabase = require('../../lib/assertDatabase')

const schema = require('../schema')

const createSampleUserRecord = timestamp => ({
   id: '1234',
   firstName: 'Evan',
   lastName: 'Summers',
   org: 'test-org',
   group: 'software-development',
   email: 'evan@test-org.com',
   created: new Date(timestamp),
   verified: false
})

const createUpdateData = timestamp => ({
   email: 'evan@test.org',
   org: 'testy-org'
})

const createExpectedDatabase = timestamp => ({
   'user:1234:h': {
      id: '1234',
      firstName: 'Evan',
      lastName: 'Summers',
      org: 'testy-org',
      group: 'software-development',
      email: 'evan@test.org',
      created: new Date(timestamp).toISOString(),
      verified: 'false'
   },
   'user::created:z': ['1234', String(timestamp)],
   'user::email:h': {
      'evan@test.org': '1234'
   },
   'user:group::testy-org:software-development:s': ['1234']
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
      const userRecord = createSampleUserRecord(state.now())
      const expectedDatabase = createExpectedDatabase(state.timestamp)
      await actions(state, schema.user).create(userRecord)
      const createdDatabase = await exportDatabase(state, 'user:*')
      logger.info('create', { createdDatabase })
      await actions(state, schema.user).update(
         userRecord.id,
         createUpdateData(state.now())
      )
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
