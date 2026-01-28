const db = require('../../../data')

const getImpsAcknowledgementLines = async (acknowledgements, sequence, transaction) => {
  const acknowledgementLines = []
  const batchNumbers = []
  acknowledgements = acknowledgements.filter(ack => parseInt(ack.batchNumber, 10) <= sequence)
  for (const acknowledgement of acknowledgements) {
    const batchNumber = await db.impsBatchNumber.findOne({ where: { invoiceNumber: acknowledgement.invoiceNumber, frn: acknowledgement.frn }, attributes: ['batchNumber', 'trader'], transaction })
    if (batchNumber) {
      const success = acknowledgement.success
      acknowledgementLines.push(`H,${batchNumber.batchNumber},04,${batchNumber.trader},${acknowledgement.invoiceNumber},${success},,,,,,`)
      batchNumbers.push(batchNumber.batchNumber)
    }
  }
  return { acknowledgementLines, batchNumbers }
}

module.exports = {
  getImpsAcknowledgementLines
}
