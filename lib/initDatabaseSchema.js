const setKey = (dict = {}, fn = v => v) =>
   Object.keys(dict).map(key => Object.assign(fn(dict[key]), { key }))

module.exports = schema => {
   schema.tableSchemas = setKey(schema, tableSchema =>
      Object.assign(tableSchema, {
         uniqueIndexArray: setKey(tableSchema.uniqueIndexes),
         groupIndexArray: setKey(tableSchema.groupIndexes),
         scoreIndexArray: setKey(tableSchema.scoreIndexes)
      })
   )
   const errors = []
   schema.tableSchemas.map(tableSchema => {
      tableSchema.uniqueIndexArray.map(uniqueIndex => {
         if (typeof uniqueIndex.uniquer !== 'function') {
            errors.push(
               `unique index ${uniqueIndex.key} missing 'uniquer' function`
            )
         }
      })
      tableSchema.groupIndexArray.map(groupIndex => {
         if (typeof groupIndex.grouper !== 'function') {
            errors.push(
               `unique index ${groupIndex.key} missing 'grouper' function`
            )
         }
      })
      tableSchema.scoreIndexArray.map(scoreIndex => {
         if (typeof scoreIndex.scorer !== 'function') {
            errors.push(
               `unique index ${scoreIndex.key} missing 'scorer' function`
            )
         }
      })
   })
}
