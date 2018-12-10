const rtx = require('multi-exec-async')
const { BadRequest } = require('../../errors')

const stringify = (fn = v => v, value) => fn(value)
const parse = (fn = v => v, value) => fn(value)

const uniqueIndexKey = (schema, index) => `${schema.key}::${index.key}:h`
const groupIndexKey = (schema, index, data) =>
   `${schema.key}:${index.key}::${index.indexer(data).join(':')}:s`
const scoreIndexKey = (schema, index, data) => `${schema.key}::${index.key}:z`

module.exports = ({ client, schema }) => async data => {
   if (!data.id) {
      const idKey = `${schema.key}:i`
      const [idRes] = await rtx(client, multi => {
         multi.incr(idKey)
      })
      data.id = idRes
   }
   const dataKey = `${schema.key}:${data.id}:h`
   client.watch(dataKey)
   const [existsRes, ...uniqueIndexesExistsRes] = await rtx(client, multi => {
      multi.exists(dataKey)
      schema.uniqueIndexArray.map(index => {
         multi.hexists(
            uniqueIndexKey(schema, index),
            index.indexer(data).join(':')
         )
      })
   })
   if (existsRes) {
      throw new BadRequest(`Primary key already exists: ${data.id}`)
   }
   const violatedIndexes = uniqueIndexesExistsRes
      .map((res, i) => (res ? schema.uniqueIndexArray[i] : null))
      .filter(index => index)
   if (violatedIndexes.length === 1) {
      const violatedIndex = violatedIndexes[0]
      throw new BadRequest(
         `Secondary key already exists: ${
            violatedIndex.key
         }, ${violatedIndex.indexer(data)}`
      )
   }
   const res = await rtx(client, multi => {
      Object.keys(data).map(key => {
         multi.hset(
            dataKey,
            key,
            stringify(schema.properties.stringify[key], data[key])
         )
      })
      schema.uniqueIndexArray.map(index => {
         multi.hset(
            uniqueIndexKey(schema, index),
            index.indexer(data).join(':'),
            data.id
         )
      })
      schema.groupIndexArray.map(index => {
         multi.sadd(groupIndexKey(schema, index, data), data.id)
      })
      schema.scoreIndexArray.map(index => {
         multi.zadd(scoreIndexKey(schema, index), index.indexer(data), data.id)
      })
   })
}
