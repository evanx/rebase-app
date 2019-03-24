const assert = require('assert')
const { execMulti } = require('@evanx/redis-async')
const lodash = require('lodash')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

module.exports = ({ redis, logger }, schema) => {
   const findIds = async query => {
      assert.strictEqual(typeof query.index, 'string', 'index')
      assert(Array.isArray(query.range), 'range')
      const scoreIndex = schema.scoreIndexes[query.index]
      assert(scoreIndex, `scoreIndex ${query.index}`)
      const [ids] = await execMulti(redis, [
         ['zrangebyscore', keys.scoreIndex(schema, scoreIndex), ...query.range],
      ])
      logger.debug({ ids }, 'findIds')
      return ids
   }

   return async query => {
      const ids = await findIds(query)
      const users = await execMulti(
         redis,
         ids.map(id => ['hgetall', keys.data(schema.key, id)]),
      )
      return users.map(schema.parseResult)
   }
}
