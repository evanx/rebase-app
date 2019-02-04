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
         db: 13,
      },
      httpServer: {
         port: 8888,
      },
      // jwtSecret: 'secret',
   },
   state: {
      subscriptions: {
         topics,
         pubsub,
      },
   },
   async start(state) {
      const { config, redis, logger } = state
      logger.warn({}, 'start')
      const { endServer } = await graphqlServer({
         config,
         typeDefs,
         resolvers,
         subscriptions: {
            onConnect: (connectionParams, webSocket) => {
               logger.info({}, 'onConnect')
               return {
                  testWebsocketContext: 'ok',
               }
            },
         },
         context: async () => {
            return {
               redis,
               logger,
            }
         },
      })
      const intervalId = setInterval(() => {
         logger.debug({ now: Date.now() }, 'publish')
      }, 2000)
      const timeoutId = setTimeout(() => {
         if (!state.intervalCleared) {
            state.intervalCleared = true
            clearInterval(intervalId)
         }
      }, 999000)
      const end = async () => {
         if (!state.ended) {
            state.ended = true
            if (!state.intervalCleared) {
               clearInterval(intervalId)
            }
            clearTimeout(timeoutId)
         }
      }
   },
})
