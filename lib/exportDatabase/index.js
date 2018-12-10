const assert = require('assert')
const rtx = require('multi-exec-async')
const { NotImplemented } = require('../errors')
const logger = require('pino')('exportDatabase')

const get = type => {
  console.log(type)
}

module.exports = async ({ client }) => {
  const keys = await client.keysAsync('*')
  const types = await rtx(client, multi => keys.map(key => multi.type(key)))
  const values = await rtx(client, multi =>
    keys.map((key, i) =>
      types[i] === 'string'
        ? multi.get(key)
        : types[i] === 'set'
        ? multi.smembers(key)
        : types[i] === 'hash'
        ? multi.hgetall(key)
        : types[i] === 'list'
        ? multi.lrange(key, 0, -1)
        : types[i] === 'zset'
        ? multi.zrange(key, 0, -1, 'withscores')
        : (type => {
            throw new NotImplemented('export key', { key, type })
          })(types[i])
    )
  )
  return keys.reduce((database, key, index) => {
    database[key] = values[index]
    return database
  }, {})
  return database
}
