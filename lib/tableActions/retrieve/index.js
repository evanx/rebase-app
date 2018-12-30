const rtx = require('multi-exec-async')

module.exports = ({ redis, logger }, schema) => async id => {
   const dataKey = `${schema.key}:${id}:h`
   const [res] = await rtx(redis, multi => {
      multi.hmgetall(dataKey)
   })
   logger.debug('retrieve', { id })
}
