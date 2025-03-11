const Joi = require('joi')
const mqConfig = require('./mq-config')
const storageConfig = require('./storage-config')
const dbConfig = require('./db-config')
const { DEVELOPMENT, TEST, PRODUCTION } = require('../constants/environments')

const schema = Joi.object({
  env: Joi.string().valid(DEVELOPMENT, TEST, PRODUCTION).default(DEVELOPMENT),
  processingInterval: Joi.number().default(10000),
  useV2Events: Joi.boolean().default(true),
  useV2ReturnFiles: Joi.boolean().optional().default(true)
})

const config = {
  env: process.env.NODE_ENV,
  processingInterval: process.env.PROCESSING_INTERVAL,
  useV2Events: process.env.USE_V2_EVENTS,
  useV2ReturnFiles: process.env.USE_V2_RETURN_FILES ?? false
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The server config is invalid. ${result.error.message}`)
}

const value = result.value

value.isDev = value.env === DEVELOPMENT
value.isTest = value.env === TEST
value.isProd = value.env === PRODUCTION
value.submitSubscription = mqConfig.submitSubscription
value.acknowledgementTopic = mqConfig.acknowledgementTopic
value.returnTopic = mqConfig.returnTopic
value.eventTopic = mqConfig.eventTopic
value.eventsTopic = mqConfig.eventsTopic
value.storageConfig = storageConfig
value.dbConfig = dbConfig

module.exports = value
