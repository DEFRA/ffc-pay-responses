const { impsBatchNumbers } = require('../../../database')

const getImpsAcknowledgementLines = async (acknowledgements, sequence, transaction) => {
  const acknowledgementLines = []
  const batchNumbers = []
  acknowledgements = acknowledgements.filter(ack => parseInt(ack.batchNumber, 10) <= sequence)
  const batchRecords = await Promise.all(acknowledgements.map(acknowledgement =>
    impsBatchNumbers(transaction ?? undefined)
      .select('batchNumber', 'trader')
      .where({ invoiceNumber: acknowledgement.invoiceNumber, frn: acknowledgement.frn })
      .first()
  ))
  for (const [index, acknowledgement] of acknowledgements.entries()) {
    const batchNumber = batchRecords[index] ?? null
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
