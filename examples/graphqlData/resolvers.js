const { GraphQLDate } = require('graphql-iso-date')
const tableActions = require('../../lib/tableActions')
const { pubsub, topics } = require('./subscriptions')

const keys = {
   record: (schemaKey, id) => `${schemaKey}:${id}:h`
}

module.exports = {
   Date: GraphQLDate,
   Query: {
      getUserById: async (parent, { id }, { redis, logger }) => {
         const key = keys.record('user', id)
         try {
            return await redis.hgetallAsync(key)
         } catch (error) {
            logger.error('getUserById', { key }, error)
            return null
         }
      },
      getUserByEmail: async (parent, { email }, state) => {
         try {
            const userActions = tableActions(state, state.schema.user)
            const result = await userActions.findUnique({
               email
            })
            return result
         } catch (error) {
            state.logger.error('getUserById', { email }, error)
            return null
         }
      }
   },
   Mutation: {
      setUserEmail: async (parent, { id, email }, { redis }) => {
         const key = keys.record('user', id)
         try {
            await redis.hsetAsync(key, 'email', email)
            return true
         } catch (error) {
            logger.error('setUserEmail', { key, value }, error)
            return false
         }
      }
   },
   Subscription: {
      recordChanged: {
         subscribe: () => pubsub.asyncIterator(topics.RECORD_CHANGED)
      }
   }
}
