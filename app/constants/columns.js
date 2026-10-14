const TABLES = require('./tables')

const PRIMARY_KEYS = {
  [TABLES.impsAcknowledgements]: 'impsAcknowledgementId',
  [TABLES.impsBatchNumbers]: 'impsBatchNumberId',
  [TABLES.impsReturns]: 'impsReturnId'
}

const COLUMNS = {
  [TABLES.lock]: [
    'lockId'
  ],
  [TABLES.schemes]: [
    'schemeId',
    'name'
  ],
  [TABLES.sequences]: [
    'schemeId',
    'nextReturn'
  ],
  [TABLES.impsAcknowledgements]: [
    'impsAcknowledgementId',
    'batchNumber',
    'invoiceNumber',
    'frn',
    'success',
    'exported'
  ],
  [TABLES.impsBatchNumbers]: [
    'impsBatchNumberId',
    'frn',
    'trader',
    'invoiceNumber',
    'batch',
    'batchNumber'
  ],
  [TABLES.impsReturns]: [
    'impsReturnId',
    'trader',
    'invoiceNumber',
    'status',
    'paymentReference',
    'valueGBP',
    'paymentType',
    'dateSettled',
    'valueEUR',
    'sequence',
    'exported'
  ]
}

const pickColumns = (record, table) => {
  return Object.fromEntries(
    Object.entries(record)
      .filter(([column]) => COLUMNS[table].includes(column))
      .filter(([column]) => column !== PRIMARY_KEYS[table])
  )
}

module.exports = {
  PRIMARY_KEYS,
  COLUMNS,
  pickColumns
}
