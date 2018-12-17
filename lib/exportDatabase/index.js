const assert = require('assert')
const rtx = require('multi-exec-async')
const { GeneralError, NotImplemented } = require('../errors')
const logger = require('pino')('exportDatabase')

const get = type => {
   console.log(type)
}

const which = (key, fns, elseFn) => {
   if (process.env.NODE_ENV !== 'production') {
      assert.strictEqual(typeof elseFn, 'function')
      assert.deepStrictEqual(
         Object.keys(fns).filter(key => typeof fns[key] !== 'function'),
         []
      )
   }
   const fn = fns[key] || elseFn
   assert.strictEqual(typeof fn, 'function')
   return fn(key)
}

module.exports = async ({ client }, pattern) => {
   const keys = await client.keysAsync(pattern)
   const types = await rtx(client, multi => keys.map(key => multi.type(key)))
   const values = await rtx(client, multi => {
      keys.map((key, i) => {
         which(
            types[i],
            {
               string: () => multi.get(key),
               set: () => multi.smembers(key),
               hash: () => multi.hgetall(key),
               list: () => multi.lrange(key, 0, -1),
               zset: () => multi.zrange(key, 0, -1, 'withscores'),
               stream: () => multi.xrange(key, '-', '+')
            },
            type => {
               throw new NotImplemented('export type', { key, type })
            }
         )
      })
   })
   return keys.reduce((database, key, index) => {
      database[key] = values[index]
      return database
   }, {})
   return database
}
