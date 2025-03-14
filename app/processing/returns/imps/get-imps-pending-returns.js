const db = require('../../../data')

const getImpsPendingReturns = async (transaction) => {
  return db.impsReturn.findAll({
    where: { exported: null },
    transaction,
    lock: true,
    skipLocked: true
  })
}

module.exports = {
  getImpsPendingReturns
}
