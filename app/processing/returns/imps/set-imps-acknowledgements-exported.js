const { impsAcknowledgements } = require('../../../database')

const setImpsAcknowledgementsExported = async (acknowledgements, transaction) => {
  const exportedIds = acknowledgements.map(ack => ack.impsAcknowledgementId)
  return impsAcknowledgements(transaction ?? undefined)
    .whereIn('impsAcknowledgementId', exportedIds)
    .update({ exported: new Date() })
}

module.exports = {
  setImpsAcknowledgementsExported
}
