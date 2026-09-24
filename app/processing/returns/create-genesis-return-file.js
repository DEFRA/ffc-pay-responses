const moment = require('moment')
const { getSchemeIds } = require('ffc-pay-schemes')
const { getAndIncrementSequence } = require('./sequence/get-and-increment-sequence')
const { publishReturnFile } = require('./publish-return-file')

const { ES } = getSchemeIds()

const createGenesisReturnFile = async (content, filename, transaction) => {
  const { sequenceString } = await getAndIncrementSequence(ES, transaction)
  const currentDate = moment()

  const returnFilename = `GENESISPayConf_${currentDate.format('YYYYMMDD')}_${sequenceString}.gni`
  const controlFilename = returnFilename.replace('.gni', '.gni.ctl')
  const returnFileContent = content.map(x => {
    const row = x.split('^')
    switch (row[0]) {
      case 'H':
        return [row[0], currentDate.format('DD/MM/YYYY'), row[2], row[3], sequenceString].join('^')
      case 'D':
        return row.join('^')
      case 'T':
        return [row[0], currentDate.format('DD/MM/YYYY'), currentDate.format('HH:mm:ss')].join('^')
      default:
        return ''
    }
  }).filter(x => x !== '').join('\r\n')

  await publishReturnFile(returnFilename, returnFileContent, controlFilename, null)
}

module.exports = {
  createGenesisReturnFile
}
