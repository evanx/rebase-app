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
         } catch (err) {
            logger.error({ key, err }, 'getUserById')
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
         } catch (err) {
            state.logger.error({ email, err }, 'getUserById')
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
         } catch (err) {
            logger.error({ key, value, err }, 'setUserEmail')
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
