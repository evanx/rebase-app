const schema = require('../schema')
const initDatabaseSchema = require('../../lib/initDatabaseSchema')
const graphqlServer = require('../../lib/graphqlServer')
const resolvers = require('./resolvers')
const typeDefs = require('./typeDefs')
const { pubsub, topics } = require('./subscriptions')

require('../../lib/app')({
   config: {
      testing: true,
      systemKey: 'rebase:test',
      serviceKey: 'examples:graphql-data',
      redis: {
         db: 13,
      },
      httpServer: {
         port: 8888,
      },
   },
   state: {
      subscriptions: {
         topics,
         pubsub,
      },
   },
   async start(state) {
      const { config, redis, logger } = state
      initDatabaseSchema(state, schema)
      const { endServer } = await graphqlServer({
         config,
         typeDefs,
         resolvers,
         subscriptions: {
            onConnect: (connectionParams, webSocket) => {
               logger.debug({}, 'onConnect')
               return {}
            },
         },
         context: async () => {
            return {
               redis,
               logger,
               schema,
            }
         },
      })
   },
})
