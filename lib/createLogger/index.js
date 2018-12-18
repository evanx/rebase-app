const assert = require('assert')
const colors = require('colors/safe')

module.exports = ({ client, config, now }, { name }) => {
   assert(now, 'now')
   assert(name, 'name')
   const levelColors = {
      error: 'red',
      warn: 'yellow',
      info: 'blue',
      debug: 'magenta'
   }
   const log = level => data => {
      const timestamp = now()
      if (data instanceof Error) {
         console.log(data)
      } else {
         console.log(
            colors.gray(new Date(timestamp).toISOString().substring(0, 19)),
            colors.cyan(name),
            colors[levelColors[level]](level),
            JSON.stringify(data, null, 2)
         )
      }
      client
         .xaddAsync(
            `logger:${config.serviceId}:x`,
            `${timestamp}-1`,
            'name',
            name,
            'level',
            level,
            'data',
            JSON.stringify(data)
         )
         .catch(err => {
            console.log(
               JSON.stringify({ name, level, timestamp, data, err }, null, 2)
            )
         })
   }
   return ['error', 'warn', 'info', 'debug'].reduce((logger, level) => {
      logger[level] = log(level)
      return logger
   }, {})
}
