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
   updated: new Date(timestamp),
   verified: false
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
      initDatabaseSchema(state, schema)
      const userRecord = createSampleUserRecord(state.now())
      await actions(state, schema.user).create(userRecord)
      const createdDatabase = await exportDatabase(state, 'user:*')
      logger.info('create', { createdDatabase })
      const userStore = actions(state, schema.user)
      const result = await userStore.findGroup({
         org: 'test-org',
         group: 'software-development'
      })
      assert.deepStrictEqual(result, [userRecord])
      logger.info('result', { result })
      return state.end()
   }
})
