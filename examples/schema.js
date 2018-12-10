module.exports = {
   user: {
      parse: userRes => userRes,
      stringify: user => user,
      validate: user => true,
      properties: {
         validate: {
            email: user => typeof user.email === 'string'
         },
         stringify: {
            created: date => date.toISOString()
         },
         parse: {
            created: string => new Date(string)
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
