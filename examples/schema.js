const { PropTypes } = require('prop-types')

module.exports = {
   user: {
      validate: user => true,
      properties: {
         email: {
            type: PropTypes.string.isRequired,
            validate: user => typeof user.email === 'string'
         },
         updated: {
            type: PropTypes.instanceOf(Date).isRequired,
            stringify: date => date.toISOString(),
            parse: string => new Date(string)
         },
         verified: {
            type: PropTypes.bool.isRequired,
            stringify: bool => String(bool),
            parse: string => string === 'true'
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
         updated: {
            fields: ['updated'],
            indexer: user => user.updated.getTime()
         }
      }
   }
}
