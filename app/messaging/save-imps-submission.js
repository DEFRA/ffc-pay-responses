const db = require('../data')
const { getExistingImpsSubmission } = require('./get-existing-imps-submission')
const { getImpsBatchNumber } = require('./get-imps-batch-number')
const { sendResponsesFailureEvent } = require('../event/send-respones-failure-event')
const { REPSONSES_PROCESSING_FAILED } = require('../constants/events')

const saveImpsSubmission = async (paymentRequest) => {
  const transaction = await db.sequelize.transaction()
  try {
    const existingSubmission = await getExistingImpsSubmission(paymentRequest.invoiceNumber, paymentRequest.frn, paymentRequest.batch, transaction)
    if (existingSubmission) {
      console.info(`Duplicate IMPS submission received, skipping ${paymentRequest.invoiceNumber}`)
      await transaction.rollback()
    } else {
      const batchNumber = getImpsBatchNumber(paymentRequest.batch)
      await db.impsBatchNumber.create({ ...paymentRequest, batchNumber }, { transaction })
      await transaction.commit()
    }
  } catch (error) {
    await transaction.rollback()
    await sendResponsesFailureEvent(paymentRequest.invoiceNumber, REPSONSES_PROCESSING_FAILED, err.message)
    throw (error)
  }
}

module.exports = {
  saveImpsSubmission
}
