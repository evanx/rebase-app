const assert = require('assert')
const lodash = require('lodash')
const rtx = require('multi-exec-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

const multiCommands = ({ logger }, multi, commands) => {
   logger.debug('multi', commands.map(command => command.join(' ')))
   commands.forEach(([command, ...args]) => {
      multi[command](...args)
   })
}

module.exports = ({ redis, logger }, schema) => {
   const findIds = async query => {
      assert.strictEqual(typeof query.index, 'string', 'index')
      assert(Array.isArray(query.range), 'range')
      const scoreIndex = schema.scoreIndexes[query.index]
      assert(scoreIndex, `scoreIndex ${query.index}`)
      const [ids] = await rtx(redis, multi => {
         multiCommands({ logger }, multi, [
            [
               'zrangebyscore',
               keys.scoreIndex(schema, scoreIndex),
               ...query.range
            ]
         ])
      })
      logger.debug('findIds', { ids })
      return ids
   }

   return async query => {
      const ids = await findIds(query)
      const users = await rtx(redis, multi => {
         multiCommands(
            { logger },
            multi,
            ids.map(id => ['hgetall', keys.data(schema.key, id)])
         )
      })
      return users.map(schema.parseResult)
   }
}
