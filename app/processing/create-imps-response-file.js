const db = require('../data')
const { IMPS } = require('../constants/schemes')
const { convertToPounds } = require('../currency-convert')
const { getAndIncrementSequence } = require('./get-and-increment-sequence')
const { getReturnBlobClient } = require('../storage')

const createImpsResponseFile = async (acknowledgements, filename, transaction) => {
  const sequence = await getAndIncrementSequence(IMPS, transaction)
  const sequenceString = sequence.toString().padStart(4, '0')

  const returnFilename = `RET_IMPS_AP_${sequenceString}.INT`
  const controlFilename = `CTL_${returnFilename}`

  const responseData = []

  for (const acknowledgement of acknowledgements) {
    const batchNumber = await db.batchNumber.findOne({ where: { invoiceNumber: acknowledgement.batchNumber, frn: acknowledgement.frn }, attributes: ['batchNumber', 'trader'], transaction })
    responseData.push(`H,${batchNumber?.trader},${batchNumber?.batchNumber},${acknowledgement.invoiceNumber},${acknowledgement.success ? 'I' : 'R'},,,,,,`)
  }

  const pendingReturns = await db.impsReturn.findAll({ where: { exported: null }, transaction, lock: true, skipLocked: true })

  for (const pendingReturn of pendingReturns) {
    const batchNumber = await db.batchNumber.findOne({ where: { invoiceNumber: pendingReturn.invoiceNumber, frn: pendingReturn.trader }, attributes: ['batchNumber'], transaction })
    responseData.push(`H,${pendingReturn.trader},${batchNumber?.batchNumber},${pendingReturn.invoiceNumber},${pendingReturn.status},${pendingReturn.paymentReference},${pendingReturn.valueGBP},${pendingReturn.paymentType},${pendingReturn.dateSettled},${pendingReturn.valueEUR},`)
  }

  const totalValue = pendingReturns.reduce((total, pendingReturn) => total + pendingReturn.valueGBP, 0)

  responseData.unshift(`B,04,${sequenceString},${convertToPounds(totalValue)},${responseData.length},S,`)

  const responseContent = responseData.join('\r\n')

  const blobClient = await getReturnBlobClient(returnFilename)
  await blobClient.upload(responseContent, responseContent.length)
  console.info(`Published ${returnFilename}`)

  const controlBlobClient = await getReturnBlobClient(controlFilename)
  await controlBlobClient.upload('', 0)
  console.info(`Published ${controlFilename}`)

  await db.impsReturn.update({ exported: new Date(), sequence }, { where: { exported: null }, transaction })
}

module.exports = {
  createImpsResponseFile
}
