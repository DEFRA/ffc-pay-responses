const blobStorage = require('../storage')
const isAcknowledgementFile = require('./is-acknowledgement-file')
const isReturnFile = require('./is-return-file')
const isPaymentFile = require('./is-payment-file')
const processAcknowledgement = require('./process-acknowledgement')
const processReturn = require('./process-return')
const processPaymentFile = require('./process-payment-file')
const config = require('../config')

const start = async () => {
  try {
    const filenameList = await blobStorage.getInboundFileList()

    if (filenameList.length > 0) {
      for (const filename of filenameList) {
        if (isAcknowledgementFile(filename)) {
          await processAcknowledgement(filename)
        } else if (isReturnFile(filename)) {
          await processReturn(filename)
        } else if (isPaymentFile(filename)) {
          await processPaymentFile(filename)
        }
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    setTimeout(start, config.processingInterval)
  }
}

module.exports = {
  start
}
