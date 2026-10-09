const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['sequences'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { updateSequence } = require('../../../../../app/processing/returns/sequence/update-sequence')

describe('updateSequence', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('updates nextReturn for the scheme using the transaction', async () => {
    await updateSequence({ schemeId: 1, nextReturn: 5 }, mockDb.trx)

    expect(mockDb.tables.sequences).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ schemeId: 1 })
    expect(mockDb.builder.update).toHaveBeenCalledWith({ nextReturn: 5 })
  })

  test('uses no transaction when none supplied', async () => {
    await updateSequence({ schemeId: 1, nextReturn: 5 })
    expect(mockDb.tables.sequences).toHaveBeenCalledWith(undefined)
  })
})
