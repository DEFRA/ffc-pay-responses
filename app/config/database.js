const { PRODUCTION } = require('../constants/environments')

const isProd = () => {
  return process.env.NODE_ENV === PRODUCTION
}

const dbConfig = {
  database: process.env.POSTGRES_DB || 'ffc_pay_responses',
  host: process.env.POSTGRES_HOST || 'ffc-pay-responses-postgres',
  port: process.env.POSTGRES_PORT || 5432,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  schema: process.env.POSTGRES_SCHEMA_NAME || 'public',
  ssl: isProd(),
  logging: process.env.POSTGRES_LOGGING || false,
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000
  }
}

module.exports = {
  development: dbConfig,
  production: dbConfig,
  test: dbConfig
}
