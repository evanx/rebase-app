const assert = require('assert')
const express = require('express')
const { createServer } = require('http')
const { ApolloServer } = require('apollo-server-express')
const bodyParser = require('body-parser')
const jwt = require('express-jwt')
const PropTypes = require('prop-types')

const validate = (target, propTypes) => {
   // TODO: Implement prop types validation
}

module.exports = async ({
   config,
   typeDefs,
   resolvers,
   subscriptions,
   context,
}) => {
   assert(config.httpServer, 'config.httpServer')
   const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
      subscriptions,
      context,
   })
   const expressApp = express()
   expressApp.use(bodyParser.json())
   if (config.jwt) {
      validate(config.jwt, {
         secret: PropTypes.string.isRequired,
         audience: PropTypes.string.isRequired,
         issuer: PropTypes.string.isRequired,
      })
      assert.strictEqual(typeof config.jwt.secret, 'string', 'secret')
      const authMiddleware = jwt(config.jwt)
      expressApp.use(authMiddleware)
   }
   apolloServer.applyMiddleware({ app: expressApp })
   const httpServer = createServer(expressApp)
   apolloServer.installSubscriptionHandlers(httpServer)
   httpServer.listen(config.httpServer, () => {
      console.log(
         `🚀 Server ready at http://localhost:${config.httpServer.port}${
            apolloServer.graphqlPath
         }`,
      )
      console.log(
         `🚀 Subscriptions ready at ws://localhost:${config.httpServer.port}${
            apolloServer.subscriptionsPath
         }`,
      )
   })
   return {
      app: expressApp,
      apolloServer,
      httpServer,
      async endServer() {
         httpServer.close()
      },
   }
}
