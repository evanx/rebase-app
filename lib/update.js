const rtx = require('multi-exec-async')

module.exports = async ({ schema, client, data }) => {
   const dataKey = `${schema.key}:${data.id}:h`
   const [replacedRes] = await rtx(client, multi => {
      multi.hgetall(dataKey)
   })
   const resRefs = []
   const res = await rtx(client, multi => {
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
