const assert = require('assert')
const express = require('express')
const { createServer } = require('http')
const { ApolloServer } = require('apollo-server-express')

module.exports = async ({
   config,
   typeDefs,
   resolvers,
   subscriptions,
   context
}) => {
   assert(config.httpServer, 'config.httpServer')
   const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      subscriptions,
      context
   })
   const expressApp = express()
   apolloServer.applyMiddleware({ app: expressApp })
   const httpServer = createServer(expressApp)
   apolloServer.installSubscriptionHandlers(httpServer)
   httpServer.listen(config.httpServer, () => {
      console.log(
         `🚀 Server ready at http://localhost:${config.httpServer.port}${
            apolloServer.graphqlPath
         }`
      )
      console.log(
         `🚀 Subscriptions ready at ws://localhost:${config.httpServer.port}${
            apolloServer.subscriptionsPath
         }`
      )
   })
   return {
      app: expressApp,
      apolloServer,
      httpServer,
      async end() {
         httpServer.close()
      }
   }
}
