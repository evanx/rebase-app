const assert = require('assert')
const lodash = require('lodash')

const setKey = (dict = {}, fn = v => v) =>
   Object.keys(dict).map(key => Object.assign(fn(dict[key]), { key }))

module.exports = ({ logger }, schema) => {
   logger = logger.child({ name: 'initDatabaseSchema' })
   assert.strictEqual(typeof schema, 'object', 'schema')
   schema.tableSchemas = setKey(schema, tableSchema =>
      Object.assign(tableSchema, {
         uniqueIndexArray: setKey(tableSchema.uniqueIndexes),
         groupIndexArray: setKey(tableSchema.groupIndexes),
         scoreIndexArray: setKey(tableSchema.scoreIndexes)
      })
   )
   const errors = []
   schema.indexFields = lodash.uniq(
      lodash.flattenDeep([
         'id',
         ...schema.tableSchemas.map(tableSchema => [
            tableSchema.uniqueIndexArray.map(index => index.fields),
            tableSchema.groupIndexArray.map(index => index.fields),
            tableSchema.scoreIndexArray.map(index => index.fields)
         ])
      ])
   )
   schema.tableSchemas.map(tableSchema => {
      tableSchema.uniqueIndexArray.map(uniqueIndex => {
         if (typeof uniqueIndex.indexer !== 'function') {
            errors.push(
               `unique index ${uniqueIndex.key} missing 'indexer' function`
            )
         }
      })
      tableSchema.groupIndexArray.map(groupIndex => {
         if (typeof groupIndex.indexer !== 'function') {
            errors.push(
               `unique index ${groupIndex.key} missing 'indexer' function`
            )
         }
      })
      tableSchema.scoreIndexArray.map(scoreIndex => {
         if (typeof scoreIndex.indexer !== 'function') {
            errors.push(
               `unique index ${scoreIndex.key} missing 'indexer' function`
            )
         }
      })
      tableSchema.parseField = field =>
         tableSchema.properties[field] && tableSchema.properties[field].parse
            ? tableSchema.properties[field].parse
            : value => value
      tableSchema.parseFields = (fields, values) =>
         fields.reduce((result, field, i) => {
            const value = values[i]
            logger.debug({ field, value }, 'parseFields')
            result[field] = tableSchema.parseField(field)(value)
            return result
         }, {})
      tableSchema.stringifyField = field =>
         tableSchema.properties[field] &&
         tableSchema.properties[field].stringify
            ? tableSchema.properties[field].stringify
            : value => value
      tableSchema.parseResult = data =>
         Object.keys(data).reduce((result, key) => {
            result[key] = tableSchema.parseField(key)(data[key])
            return result
         }, {})
      tableSchema.stringifyData = data => {
         logger.debug({ data }, 'stringifyData')
         return Object.keys(data).reduce((result, key) => {
            result[key] = tableSchema.stringifyField(key)(data[key])
            return result
         }, {})
      }
   })
}
