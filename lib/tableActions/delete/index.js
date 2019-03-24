const assert = require('assert')
const { execMulti } = require('../../redisAsync')
const { NotFound } = require('../../errors')
const keys = require('../keys')

const stringify = (fn = v => v, value) => fn(value)
const parse = (fn = v => v, value) => fn(value)

const uniqueIndexKey = (schema, index) => `${schema.key}::${index.key}:h`
const groupIndexKey = (schema, index, data) =>
   `${schema.key}:${index.key}::${index.indexer(data).join(':')}:s`
const scoreIndexKey = (schema, index) => `${schema.key}::${index.key}:z`

module.exports = ({ redis, logger }, schema) => async data => {
   assert(data.id, 'id')
   const dataKey = `${schema.key}:${data.id}:h`
   const [existsRes] = await execMulti({ logger }, redis, [['exists', dataKey]])
   if (!existsRes) {
      throw new NotFound(`Not found`, {
         dataKey,
         schemaId: schema.key,
         dataId: data.id,
      })
   }
   const res = await execMulti({ logger }, redis, [
      ['del', dataKey],
      ...schema.uniqueIndexArray.map(index => [
         'hdel',
         uniqueIndexKey(schema, index),
         index.indexer(data).join(':'),
      ]),
      ...schema.groupIndexArray.map(index => [
         'srem',
         groupIndexKey(schema, index, data),
         data.id,
      ]),
      ...schema.scoreIndexArray.map(index => [
         'zrem',
         scoreIndexKey(schema, index),
         data.id,
      ]),
   ])
}
