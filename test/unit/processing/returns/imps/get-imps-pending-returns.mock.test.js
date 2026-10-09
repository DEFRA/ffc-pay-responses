const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsReturns'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getImpsPendingReturns } = require('../../../../../app/processing/returns/imps/get-imps-pending-returns')

describe('getImpsPendingReturns (query construction)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([{ impsReturnId: 1 }])
  })

  test('selects unexported rows, locking and skipping locked, with the transaction', async () => {
    const result = await getImpsPendingReturns(mockDb.trx)

    expect(mockDb.tables.impsReturns).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereNull).toHaveBeenCalledWith('exported')
    expect(mockDb.builder.forUpdate).toHaveBeenCalled()
    expect(mockDb.builder.skipLocked).toHaveBeenCalled()
    expect(result).toEqual([{ impsReturnId: 1 }])
  })

  test('uses no transaction when none supplied', async () => {
    await getImpsPendingReturns()
    expect(mockDb.tables.impsReturns).toHaveBeenCalledWith(undefined)
  })
})
