const moment = require('moment')
const { impsBatchNumbers, impsReturns } = require('../../../database')
const { convertToPounds } = require('../../../currency-convert')

const getImpsPendingReturnLines = async (pendingReturns, acknowledgedBatchNumbers, transaction) => {
  const pendingReturnLines = []
  let totalValue = 0
  for (const pendingReturn of pendingReturns) {
    const batchNumber = (await impsBatchNumbers(transaction ?? undefined)
      .select('batchNumber')
      .where({ invoiceNumber: pendingReturn.invoiceNumber, trader: pendingReturn.trader })
      .first()) ?? null
    if (batchNumber && !acknowledgedBatchNumbers.includes(batchNumber.batchNumber)) {
      pendingReturnLines.push(`H,${batchNumber.batchNumber},04,${pendingReturn.trader},${pendingReturn.invoiceNumber},${pendingReturn.status},${pendingReturn.paymentReference},${convertToPounds(pendingReturn.valueGBP)},${pendingReturn.paymentType},${pendingReturn.dateSettled},${pendingReturn.valueEUR},`)
      totalValue += pendingReturn.valueGBP
      await impsReturns(transaction ?? undefined)
        .where({ impsReturnId: pendingReturn.impsReturnId })
        .update({ exported: moment().toDate() })
    }
  }
  return {
    pendingReturnLines,
    totalValue
  }
}

module.exports = {
  getImpsPendingReturnLines
}
