module.exports = async context => {
   return pattern => {
      let count = 0
      let cursor = 0
      while (true) {
         const [result] = await multiExecAsync(client, multi => {
            multi.scan(cursor, 'match', pattern)
         })
         cursor = parseInt(result[0])
         if (cursor === 0) {
            break
         }
      }
   }
}
