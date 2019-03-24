const assert = require('assert')
const { execMulti } = require('@evanx/redis-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

module.exports = ({ redis, logger }, schema) => {
   const findId = async query => {
      const uniqueIndex = schema.uniqueIndexArray.find(
         index => !index.fields.some(field => !query[field]),
      )
      const [id] = await execMulti(redis, [
         [
            'hget',
            keys.uniqueIndex(schema, uniqueIndex),
            uniqueIndex.indexer(query).join(':'),
         ],
      ])
      logger.debug({ id }, 'findId')
      return id
   }

   return async query => {
      const id = await findId(query)
      const user = await execMulti(redis, [
         ['hgetall', keys.data(schema.key, id)],
      ])
      return user
   }
}
