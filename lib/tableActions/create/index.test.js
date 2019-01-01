const bluebird = require('bluebird')
const { expect } = require('chai')
const rtx = require('multi-exec-async')
const redisClientFactory = require('redis')
const lodash = require('lodash')

const initDatabaseSchema = require('../../initDatabaseSchema')
const actions = require('..')
const schema = require('../../../example/schema')

bluebird.promisifyAll(redis)

initDatabaseSchema(state, schema)

const redis = redisClientFactory.createClient()

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

describe('create', () => {
   it('setup', async () => {
      redis.select(13)
      redis.flushdb()
   })
   it('create', async () => {
      await actions.create(data, {
         redis: redis,
         schema: schema.user
      })
   })
   it('keys', async () => {
      const res = await redis.keysAsync('*')
      expect(res).length(4)
      expect(res).contains('user:1234:h')
      expect(res).contains('user::email:h')
      expect(res).contains('user:group::test-org:software-development:s')
      expect(res).contains('user::updated:z')
   })
   it('data', async () => {
      const res = await redis.hgetallAsync('user:1234:h')
      console.log('data', schema.user.parse(res))
      expect(res.org).eq('test-org')
      expect(res.group).eq('software-development')
      expect(res).eql(data, 'data')
   })
   it('teardown', async () => {
      redis.quit()
   })
})
