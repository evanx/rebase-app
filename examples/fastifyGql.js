const Fastify = require('fastify')
const GQL = require('fastify-gql')
const { makeExecutableSchema } = require('graphql-tools')

const app = Fastify()

const typeDefs = `
  type Query {
    add(x: Int, y: Int): Int
  }
`

const resolvers = {
   Query: {
      add: async (_, { x, y }) => x + y
   }
}

app.register(GQL, {
   schema: makeExecutableSchema({ typeDefs, resolvers })
})

app.get('/', async function(req, reply) {
   const query = '{ add(x: 2, y: 2) }'
   return reply.graphql(query)
})

app.listen(3000)
