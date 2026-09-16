const { getSender, sendBatchMessages: sendServiceBusMessages } = require('./service-bus')
const { createMessage } = require('./create-message')

const sendBatchMessage = async (body, type, options) => {
  const sender = getSender(options)
  const messages = body.map(message => createMessage(message, type))
  await sendServiceBusMessages(sender, messages)
}

module.exports = {
  sendBatchMessage
}
