module.exports = (...args) => ({
   create: require('./create')(...args),
   findKey: require('./findKey')(...args),
   findUnique: require('./findUnique')(...args),
   findGroup: require('./findGroup')(...args),
   findScore: require('./findScore')(...args),
   update: require('./update')(...args),
   delete: require('./delete')(...args),
})
