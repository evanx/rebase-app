function StatusError(message, statusCode, data) {
   this.name = 'StatusError'
   this.message = message || `Status ${statusCode}`
   this.statusCode = statusCode
   this.data = data
   this.constructor.prototype.__proto__ = Error.prototype
   Error.captureStackTrace(this, this.constructor)
}

module.exports = require('@feathersjs/errors')
