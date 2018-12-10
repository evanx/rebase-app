const assert = require('assert')
const rtx = require('multi-exec-async')
const { NotFound } = require('../../errors')

const stringify = (fn = v => v, value) => fn(value)
const parse = (fn = v => v, value) => fn(value)

const uniqueIndexKey = (schema, index) => `${schema.key}::${index.key}:h`
const groupIndexKey = (schema, index, data) =>
  `${schema.key}:${index.key}::${index.indexer(data).join(':')}:s`
const scoreIndexKey = (schema, index) => `${schema.key}::${index.key}:z`

module.exports = ({ client, schema }) => async data => {
  assert(data.id, 'id')
  const dataKey = `${schema.key}:${data.id}:h`
  const [existsRes] = await rtx(client, multi => {
    multi.exists(dataKey)
  })
  if (!existsRes) {
    throw new NotFound(`Not found`, {
      dataKey,
      schema_key: schema.key,
      data_id: data.id
    })
  }
  const res = await rtx(client, multi => {
    multi.del(dataKey)
    schema.uniqueIndexArray.map(index => {
      multi.hdel(uniqueIndexKey(schema, index), index.indexer(data).join(':'))
    })
    schema.groupIndexArray.map(index => {
      multi.srem(groupIndexKey(schema, index, data), data.id)
    })
    schema.scoreIndexArray.map(index => {
      multi.zrem(scoreIndexKey(schema, index), data.id)
    })
  })
}