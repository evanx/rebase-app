module.exports = (...args) => ({
   create: require('./create')(...args),
   retrieve: require('./retrieve')(...args),
   update: require('./update')(...args),
   delete: require('./delete')(...args)
})
