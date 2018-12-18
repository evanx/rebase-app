const bluebird = require('bluebird')
const redis = require('redis')
const redisStreamCommands = ['xadd', 'xrem', 'xrange', 'xread']
redisStreamCommands.map(command => redis.add_command(command))
bluebird.promisifyAll(redis)

module.exports = redis
