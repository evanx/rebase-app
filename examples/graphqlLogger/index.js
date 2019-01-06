const graphqlServer = require('../../lib/graphqlServer')
const resolvers = require('./resolvers')
const typeDefs = require('./typeDefs')
const { pubsub, topics } = require('./subscriptions')

require('../../lib/app')({
   config: {
      testing: true,
      systemKey: 'rebase:test',
      serviceKey: 'examples:graphql-logger',
      redis: {
         db: 13
      },
      httpServer: {
         port: 8888
      }
   },
   state: {
      subscriptions: {
         topics,
         pubsub
      }
   },
   async start(state) {
      const { config, redis, logger } = state
      const { end } = await graphqlServer({
         config,
         typeDefs,
         resolvers,
         subscriptions: {
            onConnect: (connectionParams, webSocket) => {
               logger.debug('onConnect')
               return {
                  testWebsocketContext: 'ok'
               }
            }
         },
         context: async () => {
            return {
               redis,
               logger
            }
         }
      })

      setInterval(() => {
         logger.debug('publish', { topic: topics.LOGGER_CHANGED })
      }, 2000)
   }
})
