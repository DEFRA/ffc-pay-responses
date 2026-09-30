const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsAcknowledgements'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getImpsPendingAcknowledgements } = require('../../../../../app/processing/returns/imps/get-imps-pending-acknowledgements')

describe('getImpsPendingAcknowledgements (query construction)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([{ batchNumber: '1' }, { batchNumber: '3' }])
  })

  test('queries unexported rows with the transaction and filters by sequence', async () => {
    const result = await getImpsPendingAcknowledgements(2, mockDb.trx)

    expect(mockDb.tables.impsAcknowledgements).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereNull).toHaveBeenCalledWith('exported')
    expect(result).toEqual([{ batchNumber: '1' }])
  })

  test('uses no transaction when none supplied', async () => {
    await getImpsPendingAcknowledgements(2)
    expect(mockDb.tables.impsAcknowledgements).toHaveBeenCalledWith(undefined)
  })
})
