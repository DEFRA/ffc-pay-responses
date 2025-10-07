const config = require('../config')
const { EventPublisher } = require('ffc-pay-event-publisher')
const { RESPONSE_REJECTED } = require('../constants/events')
const { SOURCE } = require('../constants/source')

const sendResponsesQuarantineEvent = async (filename, error) => {
  const event = {
    source: SOURCE,
    type: RESPONSE_REJECTED,
    subject: filename,
    data: {
      message: error.message,
      filename
    }
  }
  const eventPublisher = new EventPublisher(config.eventsTopic)
  await eventPublisher.publishEvent(event)
}

module.exports = {
  sendResponsesQuarantineEvent
}
