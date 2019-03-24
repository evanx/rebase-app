const assert = require('assert')
const { execMulti } = require('@evanx/redis-async')

module.exports = ({ logger }, client, commands) => {
   assert.strictEqual(typeof logger, 'object', 'logger')
   logger.debug({ commands: commands.map(array => array.join(' ')) })
   return execMulti(client, commands)
}
