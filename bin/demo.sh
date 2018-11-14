
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

zrange() {
  echo redis-cli zrange "$1" 0 -1
  redis-cli zrange "$1" 0 -1
  redis-cli del "$1"
}

redis-cli keys 'user:*'

hgetall "user:1234:h"
hgetall "user:unique:email:h"
smembers "user:group:group:test-org:software-development:s"
zrange "user:index:created:z"

redis-cli keys 'user:*'
