const { impsBatchNumbers, transaction: startTransaction } = require('../database')
const { getExistingImpsSubmission } = require('./get-existing-imps-submission')
const { getImpsBatchNumber } = require('./get-imps-batch-number')
const { sendResponsesFailureEvent } = require('../event/send-respones-failure-event')
const { REPSONSES_PROCESSING_FAILED } = require('../constants/events')

const saveImpsSubmission = async (paymentRequest) => {
  const transaction = await startTransaction()
  try {
    const existingSubmission = await getExistingImpsSubmission(paymentRequest.invoiceNumber, paymentRequest.frn, paymentRequest.batch, transaction)
    if (existingSubmission) {
      console.info(`Duplicate IMPS submission received, skipping ${paymentRequest.invoiceNumber}`)
      await transaction.rollback()
    } else {
      const batchNumber = getImpsBatchNumber(paymentRequest.batch)
      await impsBatchNumbers(transaction).insert({
        invoiceNumber: paymentRequest.invoiceNumber,
        trader: paymentRequest.trader,
        frn: paymentRequest.frn,
        batch: paymentRequest.batch,
        batchNumber
      })
      await transaction.commit()
    }
  } catch (error) {
    await transaction.rollback()
    await sendResponsesFailureEvent(paymentRequest.invoiceNumber, REPSONSES_PROCESSING_FAILED, error.message)
    throw (error)
  }
}

module.exports = {
  saveImpsSubmission
}
