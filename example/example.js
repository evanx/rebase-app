const assert = require('assert')
const rtx = require('multi-exec-async')
const redis = require('redis')

const actions = require('../lib/tableActions.js')
const initDatabaseSchema = require('../lib/initDatabaseSchema.js')

const state = {}

const schema = {
   user: {
      parse: userRes => userRes,
      stringify: user => user,
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
            indexer: user => [user.email]
         }
      },
      groupIndexes: {
         group: {
            indexer: user => [user.org, user.group]
         }
      }
   }
}

const end = async () => {
   state.client.quit()
}

const start = async () => {
   initDatabaseSchema(schema)
   state.client = redis.createClient()
   await actions.create(
      {
         id: '1234',
         firstName: 'Evan',
         lastName: 'Summers',
         org: 'test-org',
         group: 'software-development',
         email: 'evan@test-org.com',
         created: new Date(),
         verified: false
      },
      {
         client: state.client,
         schema: schema.user
      }
   )
}

start()
   .then(() => {
      console.log('end')
      return end()
   })
   .catch(err => {
      console.error(err)
      return end()
   })
