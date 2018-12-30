const rtx = require('multi-exec-async')

module.exports = ({ redis, logger }, schema) => async (id, data) => {
   const dataKey = `${schema.key}:${id}:h`
   const [replacedRes] = await rtx(redis, multi => {
      multi.hmget(dataKey, ...Object.keys(data))
   })
   logger.debug('update')
}
