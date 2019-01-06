const { withFilter } = 'graphql-subscriptions'

const { pubsub, topics } = require('./subscriptions')

const mapStreamHashes = array => {
   const res = {}
   for (let i = 0; i < array.length; i += 2) {
      res[array[i]] = array[i + 1]
   }
   return res
}

module.exports = {
   Query: {
      get: (parent, { key }, { redis, logger }) => {
         try {
            logger.debug('get', { key })
            return redis.getAsync(key)
         } catch (error) {
            logger.error('get', { key }, error)
            return null
         }
      },
      xreadLogger: async (parent, { key, id = '0-0' }, { redis, logger }) => {
         try {
            logger.debug('xreadLogger', { key, id })
            const [[streamKey, items]] = await redis.xreadAsync(
               'streams',
               key,
               id
            )
            const res = items.map(([id, hashes]) => ({
               id,
               ...mapStreamHashes(hashes)
            }))
            return res
         } catch (error) {
            logger.error('xreadLogger', { key, id }, error)
            return null
         }
      },
      xrangeLogger: async (
         parent,
         { key, start = '0-0', end = '0-0', count = 99 },
         { redis, logger }
      ) => {
         try {
            logger.debug('xrangeLogger', { key, start, end, count })
            const items = await redis.xrangeAsync(
               key,
               start,
               end,
               'COUNT',
               count
            )
            const res = items.map(([id, hashes]) => ({
               id,
               ...mapStreamHashes(hashes)
            }))
            return res
         } catch (error) {
            logger.error('xrangeLogger', { key, start, end, count }, error)
            return null
         }
      }
   },
   Mutation: {
      set: async (parent, { key, value }, { redis }) => {
         try {
            await redis.setAsync(key, value)
            return true
         } catch (error) {
            logger.error('set', { key, value }, error)
            return false
         }
      }
   },
   Subscription: {
      loggerChanged: {
         subscribe: () => pubsub.asyncIterator(topics.LOGGER_CHANGED)
      }
   }
}
