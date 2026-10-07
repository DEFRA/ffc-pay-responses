const { getSchemeIds } = require('ffc-pay-schemes')
const { saveImpsSubmission } = require('./save-imps-submission')

const { IMPS } = getSchemeIds()

const processSubmitMessage = async (message, receiver) => {
  try {
    const paymentRequest = message.body
    if (paymentRequest.schemeId === IMPS) {
      console.log('Submitted IMPS payment request received:', { frn: paymentRequest.frn, invoiceNumber: paymentRequest.invoiceNumber })
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
