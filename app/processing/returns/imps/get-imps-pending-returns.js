const { impsReturns } = require('../../../database')

const getImpsPendingReturns = async (transaction) => {
  return impsReturns(transaction ?? undefined)
    .whereNull('exported')
    .forUpdate()
    .skipLocked()
}

module.exports = {
  getImpsPendingReturns
}
