const moment = require('moment')
const { getSourceSystems } = require('ffc-pay-schemes')
const { convertToPence } = require('../../../currency-convert')
const { createHash } = require('../create-hash')
const { AP } = require('../../../constants/ledgers')
const { IMPS } = getSourceSystems()

const paymentJobNumberIndex = 1
const fesCodeIndex = 2
const traderNumberIndex = 3
const invoiceNumberIndex = 4
const settledIndex = 5
const referenceIndex = 6
const valueIndex = 7
const paymentTypeIndex = 8
const settlementDateIndex = 9
const valueEURIndex = 10
const exchangeRateIndex = 11

const parseImpsReturnFile = (csv, filename) => {
  return csv.map(x => {
    const row = x.split(',')
    const value = `${IMPS}${row[paymentJobNumberIndex]}${row[fesCodeIndex]}${row[traderNumberIndex]}${row[invoiceNumberIndex]}${row[settledIndex]}${row[referenceIndex]}${row[valueIndex]}${row[paymentTypeIndex]}${row[settlementDateIndex]}${row[valueEURIndex]}${row[exchangeRateIndex]}AP${filename}`
    const hash = createHash(value)
    if (row[0] === 'H') {
      return {
        sourceSystem: IMPS,
        paymentJobNumber: row[paymentJobNumberIndex],
        fesCode: row[fesCodeIndex],
        traderNumber: row[traderNumberIndex],
        invoiceNumber: row[invoiceNumberIndex],
        transactionNumber: row[invoiceNumberIndex],
        settled: row[settledIndex] === 'P',
        reference: row[referenceIndex],
        value: convertToPence(row[valueIndex]),
        paymentType: row[paymentTypeIndex],
        settlementDate: row[settlementDateIndex] !== '' ? moment(row[settlementDateIndex], ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MMM-YY']).toISOString() : undefined,
        valueEUR: convertToPence(row[valueEURIndex]),
        exchangeRate: row[exchangeRateIndex],
        ledger: AP,
        referenceId: hash,
        filename
      }
    } else {
      return undefined
    }
  }).filter(x => x !== undefined)
}

module.exports = {
  parseImpsReturnFile
}
