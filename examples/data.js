module.exports = {
   users: [
      {
         id: 'evan@test-org.com',
         firstName: 'Evan',
         lastName: 'Summers',
         org: 'test-org',
         group: 'software-dev',
         email: 'evan@test-org.com',
         created: '2018-10-11T10:11:12.333Z',
         verified: 'false'
      },
      {
         id: 'bryan@test-org.com',
         firstName: 'Bryan',
         lastName: 'Lamont',
         org: 'test-org',
         group: 'management',
         email: 'bryan@test-org.com',
         created: '2018-10-11T10:11:12.333Z',
         verified: 'false'
      }
   ],
   orgs: [
      {
         id: 'test-org.com',
         name: 'Test Org'
      }
   ],
   groups: [
      {
         id: 'software-dev',
         name: 'Software Development'
      },
      {
         id: 'management',
         name: 'Management'
      }
   ]
}
