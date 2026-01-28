const util = require('util')
const { sendAcknowledgementMessages } = require('../../messaging')
const { downloadFile, archiveFile } = require('../../storage')
const { createImpsReturnFile } = require('../returns/imps/create-imps-return-file')
const { isImpsAcknowledgementFile } = require('./is-imps-acknowledgement-file')
const { parseAcknowledgementFile } = require('./parse-acknowledgement-file')
const { quarantineFile } = require('../quarantine-file')
const { saveImpsAcknowledgements } = require('./save-imps-acknowledgements')

const processAcknowledgement = async (filename, transaction) => {
  console.info(`Processing acknowledgement: ${filename}`)
  const content = await downloadFile(filename)
  let messages
  try {
    messages = await parseAcknowledgementFile(content, filename)
  } catch (err) {
    await quarantineFile(filename, err)
  }
  if (messages?.length) {
    await sendAcknowledgementMessages(messages)
    if (isImpsAcknowledgementFile(filename)) {
      await saveImpsAcknowledgements(messages, transaction)
      await createImpsReturnFile(transaction)
    }
    console.log('Acknowledgements published:', util.inspect(messages, false, null, true))
    await archiveFile(filename)
  }
}

module.exports = {
  processAcknowledgement
}
