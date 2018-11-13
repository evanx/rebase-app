const rtx = require('multi-exec-async')
const { BadRequest } = require('./errors')

const stringify = (fn = v => v, value) => fn(value)
const parse = (fn = v => v, value) => fn(value)

const uniqueIndexHashesKey = (schema, index) =>
   `${schema.key}:unique:${index.key}:h`
const groupIndexHashesKey = (schema, index, data) =>
   `${schema.key}:${index.key}:${index.indexer(data).join(':')}:s`

module.exports = async (data, { client, schema }) => {
   if (!data.id) {
      const idKey = `${schema.key}:i`
      const [idRes] = await rtx(client, multi => {
         multi.incr(idKey)
      })
      data.id = idRes
   }
   const dataKey = `${schema.key}:${data.id}:h`
   const [existsRes, ...uniqueIndexesExistsRes] = await rtx(client, multi => {
      multi.exists(dataKey)
      schema.uniqueIndexArray.map(index => {
         multi.hexists(
            uniqueIndexHashesKey(schema, index),
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
            uniqueIndexHashesKey(schema, index),
            index.indexer(data).join(':'),
            data.id
         )
      })
      schema.groupIndexArray.map(index => {
         multi.sadd(groupIndexHashesKey(schema, index, data), data.id)
      })
   })
}
