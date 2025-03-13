require('log-timestamp')
require('./insights').setup()

const config = require('./config')
const messaging = require('./messaging')
const processing = require('./processing')
const { start: startServer } = require('./server')

process.on(['SIGTERM', 'SIGINT'], async () => {
  await messaging.stop()
  process.exit(0)
})

const startApp = async () => {
  await startServer()
  if (config.processingActive) {
    await messaging.start()
    await processing.start()
  } else {
    console.info('Processing capabilities are currently not enabled in this environment')
  }
}

(async () => {
  await startApp()
})()

module.exports = startApp
