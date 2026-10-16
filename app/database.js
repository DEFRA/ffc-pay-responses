const config = require('./config')
const { Database } = require('ffc-database')
const tables = require('./constants/tables')

const dbConfig = config.dbConfig[config.env]

const database = new Database({ ...dbConfig, tables })

module.exports = database.connect()
