require('./insights').setup()
require('log-timestamp')
const messaging = require('./messaging')
const processing = require('./processing')

process.on(['SIGTERM', 'SIGINT'], async () => {
  await messaging.stop()
  process.exit(0)
})

module.exports = (async () => {
  await messaging.start()
  await processing.start()
}())
