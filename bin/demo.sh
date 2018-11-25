
hgetall() {
  echo redis-cli hgetall "$1"
  redis-cli hgetall "$1"
  #redis-cli del "$1"
  echo 
}

smembers() {
  echo redis-cli smembers "$1"
  redis-cli smembers "$1"
  #redis-cli del "$1"
  echo 
}

zrange() {
  echo redis-cli zrange "$1" 0 -1 withscores
  redis-cli zrange "$1" 0 -1 withscores
  #redis-cli del "$1"
  echo 
}

keys() {
  echo redis-cli keys '*'
  redis-cli keys '*'
  echo 
}

redis-cli flushall
keys
yarn example:create
hgetall "user:1234:h"
hgetall "user::email:h"
smembers "user::group:test-org:software-development:s"
zrange "user::created:z"
keys
yarn example:delete
keys

