const { gql } = require('apollo-server-express')

module.exports = gql`
   type Query {
      get(key: String!): String
      xreadLogger(key: String!, id: String): [Logger]
      xrangeLogger(
         key: String!
         start: String
         end: String
         count: Int
      ): [Logger]
   }
   type Mutation {
      register(email: String!, password: String!, name: String!): String!
      login(email: String!, password: String!): String!
      set(key: String!, value: String!): Boolean!
   }
   type Subscription {
      loggerChanged: Logger
   }
   type Logger {
      name: String!
      timestamp: String!
      level: String!
      vars: String!
   }
`
