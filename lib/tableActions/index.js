module.exports = (...args) => ({
   create: require('./create')(...args),
   find: require('./find')(...args),
   findUnique: require('./findUnique')(...args),
   findGroup: require('./findGroup')(...args),
   findScore: require('./findScore')(...args),
   update: require('./update')(...args),
   delete: require('./delete')(...args)
})
