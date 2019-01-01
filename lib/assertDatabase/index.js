const assert = require('assert')
const jsonDiff = require('json-diff')
const rtx = require('multi-exec-async')
const { GeneralError } = require('../errors')

module.exports = (actual, expected) => {
   const diff = jsonDiff.diff(actual, expected)
   if (diff) {
      // console.log(JSON.stringify(diff, null, 2))
      throw new GeneralError('diff', { diff })
   }
}
