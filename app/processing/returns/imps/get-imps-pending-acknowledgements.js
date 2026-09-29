const { impsAcknowledgements } = require('../../../database')

const getImpsPendingAcknowledgements = async (sequence, transaction) => {
  const acknowledgements = await impsAcknowledgements(transaction ?? undefined)
    .whereNull('exported')
  return acknowledgements.filter(ack => parseInt(ack.batchNumber, 10) <= sequence)
}

module.exports = {
  getImpsPendingAcknowledgements
}
