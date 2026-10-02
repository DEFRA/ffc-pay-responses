const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsAcknowledgements'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { setImpsAcknowledgementsExported } = require('../../../../../app/processing/returns/imps/set-imps-acknowledgements-exported')

describe('setImpsAcknowledgementsExported (query construction)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('marks the given acknowledgement ids exported using the transaction', async () => {
    await setImpsAcknowledgementsExported([{ impsAcknowledgementId: 1 }, { impsAcknowledgementId: 2 }], mockDb.trx)

    expect(mockDb.tables.impsAcknowledgements).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.whereIn).toHaveBeenCalledWith('impsAcknowledgementId', [1, 2])
    expect(mockDb.builder.update).toHaveBeenCalledWith({ exported: expect.any(Date) })
  })

  test('uses no transaction when none supplied', async () => {
    await setImpsAcknowledgementsExported([])
    expect(mockDb.tables.impsAcknowledgements).toHaveBeenCalledWith(undefined)
  })
})
