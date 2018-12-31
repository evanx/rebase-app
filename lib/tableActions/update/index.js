const assert = require('assert')
const lodash = require('lodash')
const rtx = require('multi-exec-async')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

module.exports = ({ redis, logger, publish }, schema) => async (id, data) => {
   logger = logger.child({ name: 'update' }, { id, data })
   const dataKey = `${schema.key}:${id}:h`
   const updateFields = Object.keys(data)
   if (!updateFields.length) {
      throw new BadRequest('Cannot update with empty data', { id })
   }
   const uniqueIndexes = schema.uniqueIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field))
   )
   const uniqueIndexFields = lodash.uniq(
      lodash.flatten(uniqueIndexes.map(index => index.fields))
   )
   const groupIndexes = schema.groupIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field))
   )
   const groupIndexFields = lodash.uniq(
      lodash.flatten(groupIndexes.map(index => index.fields))
   )
   const scoreIndexes = schema.scoreIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field))
   )
   const scoreIndexFields = lodash.uniq(
      lodash.flatten(scoreIndexes.map(index => index.fields))
   )
   const indexFields = lodash
      .uniq(uniqueIndexFields.concat(groupIndexFields).concat(scoreIndexFields))
      .filter(field => !updateFields.includes(field))
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
   const updated = Object.assign({}, indexed, data)
   const dataStringified = schema.stringifyData(data)
   logger.debug('hmget', {
      data,
      updated,
      replaced,
      indexed
   })
   await rtx(redis, multi => {
      Object.keys(data).map(key => {
         multi.hset(dataKey, key, dataStringified[key])
      })
      uniqueIndexes.map(index => {
         multi.hdel(
            keys.uniqueIndex(schema, index),
            index.indexer(replaced).join(':')
         )
         multi.hset(
            keys.uniqueIndex(schema, index),
            index.indexer(updated).join(':'),
            id
         )
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
