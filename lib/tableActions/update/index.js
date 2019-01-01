const assert = require('assert')
const lodash = require('lodash')
const rtx = require('multi-exec-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

const multiCommands = (multi, commands) => {
   commands.forEach(([command, ...args]) => {
      multi[command](...args)
   })
}

const filterIndexes = (schema, updateFields) => ({
   unique: schema.uniqueIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field))
   ),
   group: schema.groupIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field))
   ),
   score: schema.scoreIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field))
   )
})

const mapFields = indexes =>
   lodash.uniq(
      lodash.flattenDeep([
         indexes.unique.map(index => index.fields),
         indexes.group.map(index => index.fields),
         indexes.score.map(index => index.fields)
      ])
   )

module.exports = ({ redis, logger, publish }, schema) => async (id, data) => {
   logger = logger.child({ name: 'update' }, { id, data })
   const dataKey = `${schema.key}:${id}:h`
   const updateFields = Object.keys(data)
   if (!updateFields.length) {
      throw new BadRequest('Cannot update with empty data', { id })
   }
   const indexes = filterIndexes(schema, updateFields)
   const indexFields = mapFields(indexes).filter(
      field => !updateFields.includes(field)
   )
   const [updateValues, indexValues] = await rtx(redis, multi => {
      multi.hmget(dataKey, ...updateFields)
      if (indexFields.length) {
         multi.hmget(dataKey, ...indexFields)
      }
   })
   if (updateValues[0] === null) {
      throw new NotFound(`Not found`, {
         dataKey,
         schemaId: schema.key,
         dataId: data.id
      })
   }
   const replaced = schema.parseFields(updateFields, updateValues)
   const indexed = schema.parseFields(indexFields, indexValues)
   const removing = Object.assign({}, indexed, replaced)
   const updating = Object.assign({}, indexed, data)
   const dataStringified = schema.stringifyData(data)
   logger.debug('hmget', {
      data,
      replaced,
      indexed
   })

   await rtx(redis, multi => {
      Object.keys(data).map(key => {
         multi.hset(dataKey, key, dataStringified[key])
      })
      indexes.unique.map(index => {
         multiCommands(multi, [
            [
               'hdel',
               keys.uniqueIndex(schema, index),
               index.indexer(removing).join(':')
            ],
            [
               'hset',
               keys.uniqueIndex(schema, index),
               index.indexer(updating).join(':'),
               id
            ]
         ])
      })
      indexes.group.map(index => {
         multiCommands(multi, [
            ['srem', keys.groupIndex(schema, index, removing), id],
            ['sadd', keys.groupIndex(schema, index, updating), id]
         ])
      })
      indexes.score.map(index => {
         multiCommands(multi, [
            ['zrem', keys.scoreIndex(schema, index), id],
            [
               'zadd',
               keys.scoreIndex(schema, index),
               index.indexer(updating),
               id
            ]
         ])
      })
      if (publish) {
         publish(multi, {
            type: 'table/update',
            payload: {
               schemaId: schema.key,
               dataId: data.id,
               data,
               replaced,
               indexed
            }
         })
      }
   })
}
