const moment = require('moment')
const { getSourceSystems } = require('ffc-pay-schemes')
const { convertToPence } = require('../../currency-convert')
const { createHash } = require('./create-hash')
const { AP } = require('../../constants/ledgers')

const { ES } = getSourceSystems()

const PAYMENT_ID_IDX = 1
const TRANSACTION_NUMBER_IDX = 2
const VALUE_IDX = 3
const SETTLEMENT_DATE_IDX = 4
const PAYMENT_TYPE_IDX = 5
const REFERENCE_IDX = 6
const SETTLED_IDX = 7
const DETAIL_IDX = 8

const parseGenesisReturnFile = (csv, filename) => {
  return csv.map(x => {
    const row = x.split('^')
    const value = `${ES}${row[PAYMENT_ID_IDX]}${row[TRANSACTION_NUMBER_IDX]}${row[VALUE_IDX]}${row[SETTLEMENT_DATE_IDX]}${row[PAYMENT_TYPE_IDX]}${row[REFERENCE_IDX]}${row[SETTLED_IDX]}${row[DETAIL_IDX]}AP${filename}`
    const hash = createHash(value)
    if (row[0] === 'D') {
      return {
        sourceSystem: ES,
        paymentId: row[PAYMENT_ID_IDX],
        transactionNumber: row[TRANSACTION_NUMBER_IDX],
        value: convertToPence(row[VALUE_IDX]),
        settlementDate: row[SETTLEMENT_DATE_IDX] !== '' ? moment(row[SETTLEMENT_DATE_IDX], ['YYYY-MM-DD', 'DD/MM/YYYY']).toISOString() : undefined,
        paymentType: row[PAYMENT_TYPE_IDX],
        reference: row[REFERENCE_IDX],
        settled: row[SETTLED_IDX] === 'D' || (row[SETTLED_IDX] === 'E' && row[REFERENCE_IDX] !== ''),
        detail: row[DETAIL_IDX],
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
  parseGenesisReturnFile
}
