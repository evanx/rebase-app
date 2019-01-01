const { expect } = require('chai')
const schema = require('../../example/schema')

const initDatabaseSchema = require('.')

initDatabaseSchema(state, schema)

test('indexFields', () => {
   expect(schema.indexFields).length(5)
   expect(schema.indexFields).to.eql(['id', 'email', 'org', 'group', 'updated'])
})
