const { RedisPubSub } = require('graphql-redis-subscriptions')

const pubsub = new RedisPubSub()

module.exports = {
   topics: {
      LOGGER_CHANGED: 'LOGGER_CHANGED'
   },
   pubsub
}
