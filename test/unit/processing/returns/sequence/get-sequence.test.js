const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['sequences'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getSequence } = require('../../../../../app/processing/returns/sequence/get-sequence')

describe('getSequence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('returns the locked sequence for the scheme using the transaction', async () => {
    const sequence = { schemeId: 1, nextReturn: 2 }
    mockDb.builder.resolves(sequence)

    const result = await getSequence(1, mockDb.trx)

    expect(mockDb.tables.sequences).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ schemeId: 1 })
    expect(mockDb.builder.forUpdate).toHaveBeenCalled()
    expect(result).toBe(sequence)
  })

  test('uses no transaction and returns null when nothing found', async () => {
    const result = await getSequence(1)
    expect(mockDb.tables.sequences).toHaveBeenCalledWith(undefined)
    expect(result).toBeNull()
  })

  test('treats a null transaction as none', async () => {
    await getSequence(1, null)
    expect(mockDb.tables.sequences).toHaveBeenCalledWith(undefined)
  })
})
