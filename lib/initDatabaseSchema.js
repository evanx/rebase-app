const initGroupIndexSchema = (key, indexSchema) => {
   indexSchema.key = key
   return indexSchema
}

const initUniqueIndexSchema = (key, indexSchema) => {
   indexSchema.key = key
   return indexSchema
}

const initTableSchema = (key, tableSchema) => {
   tableSchema.key = key
   tableSchema.groupIndexArray = Object.keys(tableSchema.groupIndexes).map(
      key => initGroupIndexSchema(key, tableSchema.groupIndexes[key])
   )
   tableSchema.uniqueIndexArray = Object.keys(tableSchema.uniqueIndexes).map(
      key => initUniqueIndexSchema(key, tableSchema.uniqueIndexes[key])
   )
}

const initDatabaseSchema = schema => {
   Object.keys(schema).map(key => initTableSchema(key, schema[key]))
}

module.exports = initDatabaseSchema
