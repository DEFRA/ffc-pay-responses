const { impsBatchNumbers } = require('../../../database')

const allImpsAcknowledgementsReceived = async (acknowledgements, sequence, transaction) => {
  const batchNumber = sequence.toString()
  const sequenceAcknowledgements = acknowledgements.filter(ack => ack.batchNumber === batchNumber)
  const invoicesForSequence = await impsBatchNumbers(transaction ?? undefined).where({ batchNumber })
  return sequenceAcknowledgements.length >= invoicesForSequence.length && invoicesForSequence.length !== 0
}

module.exports = {
  allImpsAcknowledgementsReceived
}
