const Joi = require('joi')
const { PRODUCTION } = require('../constants/environments')

const mqSchema = Joi.object({
  messageQueue: {
    host: Joi.string(),
    username: Joi.string(),
    password: Joi.string(),
    useCredentialChain: Joi.bool().default(false),
    appInsights: Joi.object(),
    managedIdentityClientId: Joi.string().optional()
  },
  submitSubscription: {
    address: Joi.string(),
    topic: Joi.string(),
    numberOfReceivers: Joi.number().default(1),
    type: Joi.string().default('subscription')
  },
  acknowledgementTopic: {
    name: Joi.string(),
    address: Joi.string()
  },
  returnTopic: {
    name: Joi.string(),
    address: Joi.string()
  },
  eventTopic: {
    address: Joi.string()
  },
  eventsTopic: {
    address: Joi.string()
  }
})
const mqConfig = {
  messageQueue: {
    host: process.env.MESSAGE_QUEUE_HOST,
    username: process.env.MESSAGE_QUEUE_USER,
    password: process.env.MESSAGE_QUEUE_PASSWORD,
    useCredentialChain: process.env.NODE_ENV === PRODUCTION,
    appInsights: process.env.NODE_ENV === PRODUCTION ? require('applicationinsights') : undefined,
    managedIdentityClientId: process.env.AZURE_CLIENT_ID
  },
  submitSubscription: {
    address: process.env.PAYMENTSUBMIT_SUBSCRIPTION_ADDRESS,
    topic: process.env.PAYMENTSUBMIT_TOPIC_ADDRESS,
    numberOfReceivers: process.env.PAYMENTSUBMIT_SUBSCRIPTION_RECEIVERS,
    type: 'subscription'
  },
  acknowledgementTopic: {
    name: process.env.ACKNOWLEDGEMENT_TOPIC_NAME,
    address: process.env.ACKNOWLEDGEMENT_TOPIC_ADDRESS
  },
  returnTopic: {
    name: process.env.RETURN_TOPIC_NAME,
    address: process.env.RETURN_TOPIC_ADDRESS
  },
  eventTopic: {
    address: process.env.EVENT_TOPIC_ADDRESS
  },
  eventsTopic: {
    address: process.env.EVENTS_TOPIC_ADDRESS
  }
}

const mqResult = mqSchema.validate(mqConfig, {
  abortEarly: false
})

// Throw if config is invalid
if (mqResult.error) {
  throw new Error(`The message queue config is invalid. ${mqResult.error.message}`)
}

const submitSubscription = { ...mqResult.value.messageQueue, ...mqResult.value.submitSubscription }
const acknowledgementTopic = { ...mqResult.value.messageQueue, ...mqResult.value.acknowledgementTopic }
const returnTopic = { ...mqResult.value.messageQueue, ...mqResult.value.returnTopic }
const eventTopic = { ...mqResult.value.messageQueue, ...mqResult.value.eventTopic }
const eventsTopic = { ...mqResult.value.messageQueue, ...mqResult.value.eventsTopic }

module.exports = {
  submitSubscription,
  acknowledgementTopic,
  returnTopic,
  eventTopic,
  eventsTopic
}
