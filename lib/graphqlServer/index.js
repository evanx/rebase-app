const assert = require('assert')
const express = require('express')
const bodyParser = require('body-parser')
const { graphiqlExpress, graphqlExpress } = require('apollo-server-express')
import { makeExecutableSchema } from 'graphql-tools'

module.exports = ({ config, typeDefs, resolvers, context }) => {
   assert(config.port, 'port')
   assert(context.client, 'client')
   const schema = makeExecutableSchema({
      typeDefs,
      resolvers
   })
   const app = express()
   app.use('/graphql', bodyParser.json(), graphqlExpress({ schema, context }))
   app.use('/graphiql', graphiqlExpress({ endpointURL: '/graphql' }))
   const server = app.listen(config.port)
   return {
      app,
      server,
      async end() {
         server.close()
      }
   }
}
