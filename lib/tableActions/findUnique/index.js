const assert = require('assert')
const lodash = require('lodash')
const rtx = require('multi-exec-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

const multiCommands = ({ logger }, multi, commands) => {
   logger.debug(
      { commands: commands.map(command => command.join(' ')) },
      'multi'
   )
   commands.forEach(([command, ...args]) => {
      multi[command](...args)
   })
}

module.exports = ({ redis, logger }, schema) => {
   const findId = async query => {
      const uniqueIndex = schema.uniqueIndexArray.find(
         index => !index.fields.some(field => !query[field])
      )
      const [id] = await rtx(redis, multi => {
         multiCommands({ logger }, multi, [
            [
               'hget',
               keys.uniqueIndex(schema, uniqueIndex),
               uniqueIndex.indexer(query).join(':')
            ]
         ])
      })
      logger.debug({ id }, 'findId')
      return id
   }

   return async query => {
      const id = await findId(query)
      const [user] = await rtx(redis, multi => {
         multiCommands({ logger }, multi, [
            ['hgetall', keys.data(schema.key, id)]
         ])
      })
      return schema.parseResult(user)
   }
}
