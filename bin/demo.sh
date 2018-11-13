
yarn example

hgetall() {
  echo redis-cli hgetall "$1"
  redis-cli hgetall "$1"
  redis-cli del "$1"
}

smembers() {
  echo redis-cli smembers "$1"
  redis-cli smembers "$1"
  redis-cli del "$1"
}

redis-cli keys 'user:*'

hgetall "user:1234:h"
hgetall "user:unique:email:h"
smembers "user:group:test-org:software-development:s"

redis-cli keys 'user:*'
