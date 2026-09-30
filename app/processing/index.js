const { transaction: startTransaction, lock } = require('../database')
const config = require('../config')
const { getInboundFileList } = require('../storage')
const { isAcknowledgementFile, processAcknowledgement } = require('./acknowledgements')
const { isReturnFile, processReturn } = require('./returns')
const { isPaymentFile, processPaymentFile } = require('./payments')

const processFile = async (filename, transaction) => {
  if (isAcknowledgementFile(filename)) {
    await processAcknowledgement(filename, transaction)
  } else if (isReturnFile(filename)) {
    await processReturn(filename, transaction)
  } else if (isPaymentFile(filename)) {
    await processPaymentFile(filename)
  }
}

const start = async () => {
  const transaction = await startTransaction()
  try {
    await lock(transaction).where({ lockId: 1 }).forUpdate().first()

    const filenames = await getInboundFileList()

    // files must be processed one at a time, in order, within the shared transaction
    await filenames.reduce(
      (previous, filename) => previous.then(() => processFile(filename, transaction)),
      Promise.resolve()
    )
    await transaction.commit()
  } catch (err) {
    console.error(err)
    await transaction.rollback()
  } finally {
    setTimeout(start, config.processingInterval)
  }
}

module.exports = {
  start
}
