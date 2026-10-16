const { impsBatchNumbers } = require('../database')

const getExistingImpsSubmission = async (invoiceNumber, frn, batch, transaction) => {
  return (await impsBatchNumbers(transaction ?? undefined)
    .where({ invoiceNumber, frn, batch })
    .forUpdate()
    .first()) ?? null
}

module.exports = {
  getExistingImpsSubmission
}
