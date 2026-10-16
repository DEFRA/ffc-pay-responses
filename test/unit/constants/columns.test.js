const TABLES = require('../../../app/constants/tables')
const { PRIMARY_KEYS, COLUMNS, pickColumns } = require('../../../app/constants/columns')

describe('pickColumns', () => {
  test('keeps properties that are columns on the table', () => {
    const record = { batchNumber: 1, invoiceNumber: 'value' }

    expect(pickColumns(record, TABLES.impsAcknowledgements)).toEqual(record)
  })

  test('drops properties that are not columns on the table', () => {
    const result = pickColumns({ batchNumber: 1, notAColumn: 'value' }, TABLES.impsAcknowledgements)

    expect(result).toEqual({ batchNumber: 1 })
  })

  test('drops the primary key', () => {
    const result = pickColumns({ impsAcknowledgementId: 1, batchNumber: 1 }, TABLES.impsAcknowledgements)

    expect(result).toEqual({ batchNumber: 1 })
  })

  test('returns an empty object when given no properties', () => {
    expect(pickColumns({}, TABLES.impsAcknowledgements)).toEqual({})
  })
})

describe('PRIMARY_KEYS', () => {
  test('each primary key is a column on its table', () => {
    for (const [table, primaryKey] of Object.entries(PRIMARY_KEYS)) {
      expect(COLUMNS[table]).toContain(primaryKey)
    }
  })
})
