const moment = require('moment')
const { getSchemeIds } = require('ffc-pay-schemes')
const { getAndIncrementSequence } = require('./sequence/get-and-increment-sequence')
const { publishReturnFile } = require('./publish-return-file')

const { FC } = getSchemeIds()

const createGlosReturnFile = async (content, filename, transaction) => {
  const { sequenceString } = await getAndIncrementSequence(FC, transaction)
  const currentDate = moment()

  const returnFilename = `FCAP_${sequenceString}_RPA_${currentDate.format('YYMMDDHHmmss')}.dat`
  const controlFilename = returnFilename.replace('.dat', '.dat.ctl')
  content[0] = sequenceString
  const returnFileContent = content.join('\r\n')
  const controlCreationDate = getControlDate()
  const controlFileContent = `<RPA.Finance.PipelineComponents.ControlFileDate><CreatedDate>${controlCreationDate}</CreatedDate></RPA.Finance.PipelineComponents.ControlFileDate>`

  await publishReturnFile(returnFilename, returnFileContent, controlFilename, controlFileContent)
}

const getControlDate = () => {
  const now = new Date()

  const padZero = (num) => num.toString().padStart(2, '0')

  const day = padZero(now.getDate())
  const month = padZero(now.getMonth() + 1)
  const year = now.getFullYear()
  const hours = padZero(now.getHours())
  const minutes = padZero(now.getMinutes())
  const seconds = padZero(now.getSeconds())

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
}

module.exports = {
  createGlosReturnFile
}
