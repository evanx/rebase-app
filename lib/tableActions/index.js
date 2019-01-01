module.exports = (...args) => ({
   create: require('./create')(...args),
   find: require('./find')(...args),
   findOne: require('./findOne')(...args),
   findGroup: require('./findGroup')(...args),
   update: require('./update')(...args),
   delete: require('./delete')(...args)
})
