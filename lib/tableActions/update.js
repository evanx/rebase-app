const rtx = require('multi-exec-async')

module.exports = ({ redis, schema }) => async data => {
   const dataKey = `${schema.key}:${data.id}:h`
   const [replacedRes] = await rtx(redis, multi => {
      multi.hgetall(dataKey)
   })
   const resRefs = []
   const res = await rtx(redis, multi => {
      if (replacedRes) {
         const replaced = schema.parse(replacedRes)
      }
      schema.indexes.map(index => {
         const indexKey = `${schema.key}:index:${index.key}:h`
         multi.hrem(indexKey, replaced.id)
         resRefs.push(`${index.key} hrem`)
         multi.hset(indexKey)
         resRefs.push(`${index.key} hset`)
      })
   })
}
