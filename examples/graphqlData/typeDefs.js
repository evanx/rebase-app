const { gql } = require('apollo-server-express')

module.exports = gql`
   scalar Date
   type Query {
      getUserById(id: String!): User
   }
   type User {
      id: Int!
      firstName: String!
      lastName: String!
      org: String!
      group: String!
      email: String!
      updated: Date!
      verified: Boolean!
   }
   type Mutation {
      setUserEmail(id: String!, email: String!): User!
   }
   type Subscription {
      recordChanged: RecordChanged
   }
   type RecordChanged {
      schemaKey: String!
      timestamp: String!
      id: String!
      data: String!
   }
`
