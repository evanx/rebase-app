const assert = require('assert')
const { sendCommand, execMulti } = require('@evanx/redis-async')

exports.sendCommand = ({ logger }, client, ...args) => {
   assert.strictEqual(typeof logger, 'object', 'logger')
   logger.debug({ args: args.join(' ') })
   return sendCommand(client, ...args)
}

exports.execMulti = ({ logger }, client, commands) => {
   assert.strictEqual(typeof logger, 'object', 'logger')
   logger.debug({ commands: commands.map(array => array.join(' ')) })
   return execMulti(client, commands)
}
