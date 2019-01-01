module.exports = {
   user: {
      validate: user => true,
      properties: {
         email: {
            validate: user => typeof user.email === 'string'
         },
         created: {
            stringify: date => date.toISOString(),
            parse: string => new Date(string)
         }
      },
      uniqueIndexes: {
         email: {
            fields: ['email'],
            indexer: user => [user.email]
         }
      },
      groupIndexes: {
         group: {
            fields: ['org', 'group'],
            indexer: user => [user.org, user.group]
         }
      },
      scoreIndexes: {
         created: {
            fields: ['created'],
            indexer: user => user.created.getTime()
         }
      }
   }
}
