const assert = require('assert')
const lodash = require('lodash')
const execMulti = require('../../execMulti')
const { BadRequest, NotFound } = require('../../errors')
const keys = require('../keys')

const filterIndexes = (schema, updateFields) => ({
   unique: schema.uniqueIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field)),
   ),
   group: schema.groupIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field)),
   ),
   score: schema.scoreIndexArray.filter(index =>
      updateFields.some(field => index.fields.includes(field)),
   ),
})

const mapFields = indexes =>
   lodash.uniq(
      lodash.flattenDeep([
         indexes.unique.map(index => index.fields),
         indexes.group.map(index => index.fields),
         indexes.score.map(index => index.fields),
      ]),
   )

module.exports = ({ redis, logger }, schema) => async (id, data) => {
   logger = logger.child({ name: 'update' }, { id, data })
   const dataKey = `${schema.key}:${id}:h`
   const updateFields = Object.keys(data)
   if (!updateFields.length) {
      throw new BadRequest('Cannot update with empty data', { id })
   }
   const indexes = filterIndexes(schema, updateFields)
   const indexFields = mapFields(indexes).filter(
      field => !updateFields.includes(field),
   )
   const [updateValues, indexValues] = await execMulti({ logger }, redis, [
      ['hmget', dataKey, ...updateFields],
      ['hmget', dataKey, ...indexFields],
   ])
   if (updateValues[0] === null) {
      throw new NotFound(`Not found`, {
         dataKey,
         schemaId: schema.key,
         dataId: data.id,
      })
   }
   const replaced = schema.parseFields(updateFields, updateValues)
   const indexed = schema.parseFields(indexFields, indexValues)
   const removing = Object.assign({}, indexed, replaced)
   const updating = Object.assign({}, indexed, data)
   const dataStringified = schema.stringifyData(data)
   logger.debug({
      data,
      replaced,
      indexed,
   })

   await execMulti({ logger }, redis, [
      ...Object.keys(data).map(key => [
         'hset',
         dataKey,
         key,
         dataStringified[key],
      ]),
      ...indexes.unique.map(index => [
         'hdel',
         keys.uniqueIndex(schema, index),
         index.indexer(removing).join(':'),
      ]),
      ...indexes.unique.map(index => [
         'hset',
         keys.uniqueIndex(schema, index),
         index.indexer(updating).join(':'),
         id,
      ]),
      ...indexes.group.map(index => [
         'srem',
         keys.groupIndex(schema, index, removing),
         id,
      ]),
      ...indexes.group.map(index => [
         'sadd',
         keys.groupIndex(schema, index, updating),
         id,
      ]),
      ...indexes.score.map(index => [
         'zrem',
         keys.scoreIndex(schema, index),
         id,
      ]),
      ...indexes.score.map(index => [
         'zadd',
         keys.scoreIndex(schema, index),
         index.indexer(updating),
         id,
      ]),
   ])
   return {
      type: 'table/update',
      payload: {
         schemaId: schema.key,
         dataId: data.id,
         data,
         replaced,
         indexed,
      },
   }
}
