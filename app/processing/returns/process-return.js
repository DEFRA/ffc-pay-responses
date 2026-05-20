const { downloadFile, archiveFile } = require('../../storage')
const { parseReturnFile } = require('./parse-return-file')
const { quarantineFile } = require('../quarantine-file')
const { sendReturnMessages } = require('../../messaging')
const { isImpsReturnFile } = require('./imps/is-imps-return-file')
const { saveImpsReturns } = require('./imps/save-imps-returns')
const { isGenesisReturnFile } = require('./is-genesis-return-file')
const { createGenesisReturnFile } = require('./create-genesis-return-file')
const { isGlosReturnFile } = require('./is-glos-return-file')
const { createGlosReturnFile } = require('./create-glos-return-file')
const { canReturnMessage } = require('./can-return-message')

const processReturn = async (filename, transaction) => {
  console.info(`Processing return: ${filename}`)
  const data = await downloadFile(filename)
  const content = data.trim().split(/\r?\n/)
  let messages
  try {
    messages = parseReturnFile(content, filename)
  } catch (err) {
    await quarantineFile(filename, err)
  }
  if (messages?.length) {
    if (canReturnMessage(filename)) {
      await sendReturnMessages(messages)
    }
    console.log('Returns published:', messages.map(({ sourceSystem, reference }) => ({ sourceSystem, reference })))
    if (isImpsReturnFile(filename)) {
      await saveImpsReturns(content, transaction)
    }
    if (isGenesisReturnFile(filename)) {
      await createGenesisReturnFile(content, filename, transaction)
    }
    if (isGlosReturnFile(filename)) {
      await createGlosReturnFile(content, filename, transaction)
    }
    await archiveFile(filename)
  }
}

module.exports = {
  processReturn
}
