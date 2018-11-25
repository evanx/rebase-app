const { expect } = require('chai')
const initDatabaseSchema = require('../lib/initDatabaseSchema')
const schema = require('../example/schema')

initDatabaseSchema(schema)

test('indexFields', () => {
   expect(schema.indexFields).length(5)
   expect(schema.indexFields).to.eql(['id', 'email', 'org', 'group', 'created'])
})
