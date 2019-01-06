const { RedisPubSub } = require('graphql-redis-subscriptions')

const pubsub = new RedisPubSub()

module.exports = {
   topics: {
      RECORD_CHANGED: 'RECORD_CHANGED'
   },
   pubsub
}
