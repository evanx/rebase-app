const assert = require('assert')
const jsonDiff = require('json-diff')
const rtx = require('multi-exec-async')
const { NotImplemented } = require('../errors')
const logger = require('pino')({
   name: 'assertDatabase',
   level: 'debug',
   prettyPrint: true
})

module.exports = (actual, expected) => {
   const diff = jsonDiff.diff(actual, expected)
   if (diff) {
      logger.error({ diff })
      throw Error('Database diff')
   }
}
