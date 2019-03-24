const { execMulti } = require('../../redisAsync')
const { BadRequest } = require('../../errors')

const stringify = (fn = v => v, value) => fn(value)
const parse = (fn = v => v, value) => fn(value)

const uniqueIndexKey = (schema, index) => `${schema.key}::${index.key}:h`
const groupIndexKey = (schema, index, data) =>
   `${schema.key}:${index.key}::${index.indexer(data).join(':')}:s`
const scoreIndexKey = (schema, index, data) => `${schema.key}::${index.key}:z`

module.exports = ({ redis, logger }, schema) => async data => {
   if (!data.id) {
      const idKey = `${schema.key}:i`
      const [idRes] = await execMulti(redis, [['incr', idKey]])
      data.id = idRes
   }
   const dataKey = `${schema.key}:${data.id}:h`
   redis.watch(dataKey)
   const [existsRes, ...uniqueIndexesExistsRes] = await execMulti(
      { logger },
      redis,
      [
         ['exists', dataKey],
         ...schema.uniqueIndexArray.map(index => [
            'hexists',
            uniqueIndexKey(schema, index),
            index.indexer(data).join(':'),
         ]),
      ],
   )
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
         }, ${violatedIndex.indexer(data)}`,
      )
   }
   const commands = [
      ...Object.keys(data).map(key => [
         'hset',
         dataKey,
         key,
         schema.stringifyField(key)(data[key]),
      ]),
      ...schema.uniqueIndexArray.map(index => [
         'hset',
         uniqueIndexKey(schema, index),
         index.indexer(data).join(':'),
         data.id,
      ]),
      ...schema.groupIndexArray.map(index => [
         'sadd',
         groupIndexKey(schema, index, data),
         data.id,
      ]),
      ...schema.scoreIndexArray.map(index => [
         'zadd',
         scoreIndexKey(schema, index),
         index.indexer(data),
         data.id,
      ]),
   ]
   const res = await execMulti({ logger }, redis, commands)
}
