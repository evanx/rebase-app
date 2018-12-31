module.exports = {
   uniqueIndex: (schema, index) => `${schema.key}::${index.key}:h`,
   groupIndex: (schema, index, data) =>
      `${schema.key}:${index.key}::${index.indexer(data).join(':')}:s`,
   scoreIndex: (schema, index) => `${schema.key}::${index.key}:z`
}
