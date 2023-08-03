const moment = require('moment')
const { convertToPence } = require('../currency-convert')

const parseImpsReturnFile = (csv, filename) => {
  return csv.map(x => {
    const row = x.split(',')
    if (row[0] === 'H') {
      return {
        // Record type, payment job number, fes code, trader number, transaction number, status, payment reference, gbp value, payment type, date, eur value, exchange rate
        sourceSystem: 'IMPS',
        paymentJobNumber: row[1],
        fesCode: row[2],
        traderNumber: row[3],
        transactionNumber: row[4],
        settled: row[5] === 'P',
        reference: row[6],
        valueGBP: convertToPence(row[7]),
        paymentType: row[8],
        settlementDate: row[9] !== '' ? moment(row[9], ['YYYY-MM-DD', 'DD/MM/YYYY', 'DD-MMM-YY']).toISOString() : undefined,
        valueEUR: convertToPence(row[10]),
        exchangeRate: row[11],
        ledger: 'AP',
        filename
      }
    } else {
      return ''
    }
  }).filter(x => x !== '')
}

module.exports = parseImpsReturnFile
