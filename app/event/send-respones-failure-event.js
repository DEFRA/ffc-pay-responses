const { EventPublisher } = require('ffc-pay-event-publisher')
const messageConfig = require('../config/mq-config')

const sendResponsesFailureEvent = async (invoiceNumber, type, error) => {
  const event = {
    source: 'ffc-pay-responses',
    type,
    subject: invoiceNumber,
    data: {
      message: error,
      invoiceNumber
    }
  }
  const eventPublisher = new EventPublisher(messageConfig.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendResponsesFailureEvent
}
