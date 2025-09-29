const path = require('path')
const config = require('../config')
const dbConfig = config.dbConfig[config.env]
const modelPath = path.join(__dirname, 'models')
const { Database } = require('ffc-database')

const database = new Database({ ...dbConfig, modelPath })
const db = database.connect()

module.exports = db
