const config = require('../config/mq-config')
const { createServiceBusClient, createReceiver, subscribeReceiver, closeSenders } = require('./service-bus')
const { sendBatchMessage } = require('./send-batch-message')
const { processSubmitMessage } = require('./process-submit-message')
const { ACKNOWLEDGEMENT, RETURN } = require('../constants/messages')
const paymentReceivers = []
let sbClient

const errorHandler = (error) => {
  console.error('Error processing payment request message:', error)
}

const start = async () => {
  sbClient = createServiceBusClient(config.submitSubscription)
  for (let i = 0; i < config.submitSubscription.numberOfReceivers; i++) {
    let paymentReceiver  // eslint-disable-line
    const submitAction = message => processSubmitMessage(message, paymentReceiver)
    paymentReceiver = createReceiver(sbClient, config.submitSubscription)
    subscribeReceiver(paymentReceiver, submitAction, errorHandler, config.submitSubscription)

    paymentReceivers.push(paymentReceiver)
    console.info(`Receiver ${i + 1} ready to receive payment requests`)
  }
}

const stop = async () => {
  for (const paymentReceiver of paymentReceivers) {
    try {
      await paymentReceiver.close()
    } catch (err) {
      console.error(`Error closing payment receiver: ${err.message}`)
    }
  }
  paymentReceivers.length = 0
  if (sbClient) {
    try {
      await sbClient.close()
    } catch (err) {
      console.error(`Error closing service bus client: ${err.message}`)
    }
  }
  sbClient = null
  await closeSenders()
}

const sendAcknowledgementMessages = async (payload) => {
  await sendBatchMessage(payload, ACKNOWLEDGEMENT, config.acknowledgementTopic)
}

const sendReturnMessages = async (payload) => {
  await sendBatchMessage(payload, RETURN, config.returnTopic)
}

module.exports = {
  start,
  stop,
  sendAcknowledgementMessages,
  sendReturnMessages
}
