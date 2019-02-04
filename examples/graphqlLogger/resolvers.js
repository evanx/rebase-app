const bcrypt = require('bcrypt')
const jsonwebtoken = require('jsonwebtoken')
// const { withFilter } = require('graphql-subscriptions')
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
            logger.debug({ key }, 'get')
            return redis.getAsync(key)
         } catch (err) {
            logger.error({ key, err }, 'get')
            return null
         }
      },
      xreadLogger: async (parent, { key, id = '0-0' }, { redis, logger }) => {
         try {
            logger.debug({ key, id }, 'xreadLogger')
            const [[streamKey, items]] = await redis.xreadAsync(
               'streams',
               key,
               id,
            )
            const res = items.map(([id, hashes]) => ({
               id,
               ...mapStreamHashes(hashes),
            }))
            return res
         } catch (err) {
            logger.error({ key, id, err }, 'xreadLogger')
            return null
         }
      },
      xrangeLogger: async (
         parent,
         { key, start = '0-0', end = '0-0', count = 99 },
         context,
      ) => {
         const { redis, logger } = context
         logger.debug({ contextKeys: Object.keys(context) }, 'xrangeLogger')
         try {
            logger.debug({ key, start, end, count }, 'xrangeLogger')
            const items = await redis.xrangeAsync(
               key,
               start,
               end,
               'COUNT',
               count,
            )
            const res = items.map(([timestamp, hashes]) => ({
               timestamp,
               ...mapStreamHashes(hashes),
            }))
            return res
         } catch (err) {
            logger.error({ key, start, end, count, err }, 'xrangeLogger')
            return null
         }
      },
   },
   Mutation: {
      register: async (parent, { email, password, name }, { redis }) => {
         password = bcrypt.hashSync(password, 12)
         return `${name} <${email}>`
      },
      login: async (parent, { email, password }, { redis }) => {
         const user = { email, password: bcrypt.hashSync(password, 12) }
         const valid = await bcrypt.compare(password, user.password)
         if (!valid) {
            throw new Error('Incorrect password')
         }
         return jsonwebtoken.sign(
            {
               id: email,
               email: email,
            },
            'somesuperdupersecret',
            { expiresIn: '1y' },
         )
      },
      set: async (parent, { key, value }, { redis }) => {
         try {
            await redis.setAsync(key, value)
            return true
         } catch (err) {
            logger.error({ key, value, err }, 'set')
            return false
         }
      },
   },
   Subscription: {
      loggerChanged: {
         subscribe: () => pubsub.asyncIterator(topics.LOGGER_CHANGED),
      },
   },
}
