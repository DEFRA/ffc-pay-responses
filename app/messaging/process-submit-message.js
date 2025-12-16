const util = require('util')
const { IMPS } = require('../constants/schemes')
const { saveImpsSubmission } = require('./save-imps-submission')

const processSubmitMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    if (paymentRequest.schemeId === IMPS) {
      console.log(`Submitted IMPS payment request received: ${util.inspect(paymentRequest, false, null, true)}`)
      await saveImpsSubmission(paymentRequest)
    }
    await receiver.completeMessage(message)
  } catch (err) {
    console.error('Unable to process payment request:', err)
    receiver.deadLetterMessage(message)
  }
}

module.exports = {
  processSubmitMessage
}
