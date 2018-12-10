module.exports = context => ({
   create: require('./create')(context),
   retrieve: require('./retrieve')(context),
   update: require('./update')(context),
   delete: require('./delete')(context)
})
