const moment = require('moment')
const { convertToPence } = require('../../currency-convert')
const { createHash } = require('./create-hash')
const { AP } = require('../../constants/ledgers')
const { GLOS } = require('../../constants/source-systems')

const parseGlosReturnFile = (csv, filename) => {
  return csv.map(line => {
    const row = parseCsvLine(line)
    if (row.length >= 11) {
      const value = `${GLOS}${row[0]}${row[1]}${row[2]}${row[3]}${row[4]}${row[5]}${row[6]}${row[7]}${row[8]}${row[9]}${row[10]}AP${filename}`
      const hash = createHash(value)
      return {
        sourceSystem: GLOS,
        sbi: Number(row[0]),
        frn: Number(row[1]),
        agreementNumber: row[2],
        claimNumber: row[3],
        settlementDate: row[4] !== '' ? moment(row[4], ['YYYY-MM-DD', 'DD/MM/YYYY']).toISOString() : undefined,
        value: convertToPence(row[5]),
        reference: row[6],
        bankAccount: row[7],
        batchNumber: row[8],
        settled: row[9] === 'D' || (row[9] === 'E' && row[6] !== ''),
        detail: row[10],
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

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(currentField.replace(/""/g, '"'))
      currentField = ''
    } else {
      currentField += char
    }
  }

  if (currentField.length > 0) {
    result.push(currentField.replace(/""/g, '"'))
  } else {
    result.push('')
  }

  return result
}

module.exports = {
  parseGlosReturnFile
}
