const Joi = require('joi')

const schema = Joi.object({
  connectionStr: Joi.string().when('useConnectionStr', { is: true, then: Joi.required(), otherwise: Joi.allow('').optional() }),
  storageAccount: Joi.string().required(),
  container: Joi.string().default('dax'),
  inboundFolder: Joi.string().default('inbound'),
  archiveFolder: Joi.string().default('archive'),
  quarantineFolder: Joi.string().default('quarantine'),
  returnFolder: Joi.string().default('return'),
  useConnectionStr: Joi.boolean().default(false),
  createContainers: Joi.boolean().default(false),
  managedIdentityClientId: Joi.string().optional()
})

const config = {
  connectionStr: process.env.AZURE_STORAGE_CONNECTION_STRING,
  storageAccount: process.env.AZURE_STORAGE_ACCOUNT_NAME,
  container: process.env.AZURE_STORAGE_CONTAINER,
  inboundFolder: process.env.AZURE_STORAGE_INBOUND,
  archiveFolder: process.env.AZURE_STORAGE_ARCHIVE,
  quarantineFolder: process.env.AZURE_STORAGE_QUARANTINE,
  returnFolder: process.env.AZURE_STORAGE_RETURN,
  useConnectionStr: process.env.AZURE_STORAGE_USE_CONNECTION_STRING,
  createContainers: process.env.AZURE_STORAGE_CREATE_CONTAINERS,
  managedIdentityClientId: process.env.AZURE_CLIENT_ID
}

const result = schema.validate(config, {
  abortEarly: false
})

if (result.error) {
  throw new Error(`The blob storage config is invalid. ${result.error.message}`)
}

module.exports = result.value
