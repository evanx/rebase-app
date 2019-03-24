const assert = require('assert')
const execMulti = require('../execMulti')
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
         [],
      )
   }
   const fn = fns[key] || elseFn
   assert.strictEqual(typeof fn, 'function')
   return fn(key)
}

module.exports = async ({ redis }, pattern) => {
   const keys = await redis.keysAsync(pattern)
   const types = await execMulti(
      { logger },
      redis,
      keys.map(key => ['type', key]),
   )
   const values = await execMulti(
      { logger },
      redis,
      keys.map((key, i) =>
         which(
            types[i],
            {
               string: () => ['get', key],
               set: () => ['smembers', key],
               hash: () => ['hgetall', key],
               list: () => ['lrange', key, 0, -1],
               zset: () => ['zrange', key, 0, -1, 'withscores'],
               stream: () => ['xrange', key, '-', '+'],
            },
            type => {
               throw new NotImplemented('export type', { key, type })
            },
         ),
      ),
   )
   return keys.reduce((database, key, index) => {
      database[key] = values[index]
      return database
   }, {})
   return database
}
