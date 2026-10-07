const { transaction: startTransaction, lock } = require('../database')
const config = require('../config')
const { getInboundFileList } = require('../storage')
const { isAcknowledgementFile, processAcknowledgement } = require('./acknowledgements')
const { isReturnFile, processReturn } = require('./returns')
const { isPaymentFile, processPaymentFile } = require('./payments')

const start = async () => {
  const transaction = await startTransaction()
  try {
    await lock(transaction).where({ lockId: 1 }).forUpdate().first()

    const filenames = await getInboundFileList()

    for (const filename of filenames) {
      if (isAcknowledgementFile(filename)) {
        await processAcknowledgement(filename, transaction)
      } else if (isReturnFile(filename)) {
        await processReturn(filename, transaction)
      } else if (isPaymentFile(filename)) {
        await processPaymentFile(filename)
      } else {
        console.warn(`Unrecognised file ${filename} in inbound container, skipping`)
      }
    }
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
