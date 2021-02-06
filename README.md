# rebase-app

Experimental Redis application server archetype.

-  support secondary indexes using Redis data structures
-  application logging and analytics into Redis

Our application defines a "relational" schema for user records etc: 
https://github.com/evanx/rebase-app/blob/master/examples/schema.js

We aim to provide commands to update/query such records stores in Redis, including secondary indexes and groups: 
https://github.com/evanx/rebase-app/tree/master/lib/tableActions

