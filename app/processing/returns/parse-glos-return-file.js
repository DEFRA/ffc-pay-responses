const moment = require('moment')
const { getSourceSystems } = require('ffc-pay-schemes')
const { convertToPence } = require('../../currency-convert')
const { createHash } = require('./create-hash')
const { AP } = require('../../constants/ledgers')

const { FC } = getSourceSystems()

const SBI_IDX = 0
const FRN_IDX = 1
const AGREEMENT_NUMBER_IDX = 2
const CLAIM_NUMBER_IDX = 3
const SETTLEMENT_DATE_IDX = 4
const VALUE_IDX = 5
const REFERENCE_IDX = 6
const BANK_ACCOUNT_IDX = 7
const BATCH_NUMBER_IDX = 8
const SETTLED_IDX = 9
const DETAIL_IDX = 10

const parseGlosReturnFile = (csv, filename) => {
  return csv.map(line => {
    const row = parseCsvLine(line)
    if (row.length >= 11) {
      const value = `${FC}${row[SBI_IDX]}${row[FRN_IDX]}${row[AGREEMENT_NUMBER_IDX]}${row[CLAIM_NUMBER_IDX]}${row[SETTLEMENT_DATE_IDX]}${row[VALUE_IDX]}${row[REFERENCE_IDX]}${row[BANK_ACCOUNT_IDX]}${row[BATCH_NUMBER_IDX]}${row[SETTLED_IDX]}${row[DETAIL_IDX]}AP${filename}`
      const hash = createHash(value)
      return {
        sourceSystem: FC,
        sbi: Number(row[SBI_IDX]),
        frn: Number(row[FRN_IDX]),
        agreementNumber: row[AGREEMENT_NUMBER_IDX],
        claimNumber: row[CLAIM_NUMBER_IDX],
        settlementDate: row[SETTLEMENT_DATE_IDX] === '' ? undefined : moment(row[SETTLEMENT_DATE_IDX], ['YYYY-MM-DD', 'DD/MM/YYYY']).toISOString(),
        value: convertToPence(row[VALUE_IDX]),
        reference: row[REFERENCE_IDX],
        bankAccount: row[BANK_ACCOUNT_IDX],
        batchNumber: row[BATCH_NUMBER_IDX],
        settled: row[SETTLED_IDX] === 'D' || (row[SETTLED_IDX] === 'E' && row[REFERENCE_IDX] !== ''),
        detail: row[DETAIL_IDX],
        ledger: AP,
        referenceId: hash,
        filename
      }
    } else {
      return undefined
    }
  }).filter(record => record !== undefined)
}

// Helper function to handle quoted CSV fields
const parseCsvLine = (line) => {
  const result = []
  let currentField = ''
  let inQuotes = false

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(currentField.replaceAll('""', '"'))
      currentField = ''
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0) {
    result.push(currentField.replaceAll('""', '"'))
  } else {
    result.push('')
  }

  return result
}

module.exports = {
  parseGlosReturnFile
}
