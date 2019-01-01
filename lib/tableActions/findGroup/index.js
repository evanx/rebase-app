const assert = require('assert')
const lodash = require('lodash')
const rtx = require('multi-exec-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

const multiCommands = ({ logger }, multi, commands) => {
   logger.debug('multi', commands)
   commands.forEach(([command, ...args]) => {
      multi[command](...args)
   })
}

module.exports = ({ redis, logger }, schema) => {
   const findIds = async query => {
      const groupIndex = schema.groupIndexArray.find(
         index => !index.fields.some(field => !query[field])
      )
      const [ids] = await rtx(redis, multi => {
         multiCommands({ logger }, multi, [
            ['smembers', keys.groupIndex(schema, groupIndex, query)]
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
