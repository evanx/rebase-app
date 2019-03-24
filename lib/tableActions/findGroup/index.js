const assert = require('assert')
const lodash = require('lodash')
const { execMulti } = require('@evanx/redis-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

module.exports = ({ redis, logger }, schema) => {
   const findIds = async query => {
      const groupIndex = schema.groupIndexArray.find(
         index => !index.fields.some(field => !query[field]),
      )
      const [ids] = await execMulti(redis, [
         ['smembers', keys.groupIndex(schema, groupIndex, query)],
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
