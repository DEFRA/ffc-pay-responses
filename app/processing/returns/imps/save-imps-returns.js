const { impsReturns } = require('../../../database')
const { convertToPence } = require('../../../currency-convert')

const traderIndex = 3
const invoiceNumberIndex = 4
const statusIndex = 5
const paymentReferenceIndex = 6
const valueGBPIndex = 7
const paymentTypeIndex = 8
const dateSettledIndex = 9
const valueEURIndex = 10

const saveImpsReturns = async (content, transaction) => {
  const returns = content.map(line => {
    const data = line.split(',')
    if (data[0] === 'H') {
      return {
        trader: data[traderIndex],
        invoiceNumber: data[invoiceNumberIndex],
        status: data[statusIndex],
        paymentReference: data[paymentReferenceIndex],
        valueGBP: convertToPence(data[valueGBPIndex]),
        paymentType: data[paymentTypeIndex],
        dateSettled: data[dateSettledIndex],
        valueEUR: data[valueEURIndex]
      }
    } else {
      return undefined
    }
  }).filter(line => line !== undefined)

  if (returns.length > 0) {
    await impsReturns(transaction ?? undefined).insert(returns)
  }

  console.log(`Saved ${returns.length} IMPS returns ready for next acknowledgement response`)
}

module.exports = {
  saveImpsReturns
}
