const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsBatchNumbers'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { allImpsAcknowledgementsReceived } = require('../../../../../app/processing/returns/imps/all-imps-acknowledgements-received')

describe('allImpsAcknowledgementsReceived (query construction)', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves([{}, {}])
  })

  test('compares acknowledgements for the sequence with invoices using the transaction', async () => {
    const acks = [{ batchNumber: '1' }, { batchNumber: '1' }, { batchNumber: '2' }]
    const result = await allImpsAcknowledgementsReceived(acks, 1, mockDb.trx)

    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ batchNumber: '1' })
    expect(result).toBe(true)
  })

  test('uses no transaction when none supplied', async () => {
    const result = await allImpsAcknowledgementsReceived([{ batchNumber: '1' }], 1)
    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(undefined)
    expect(result).toBe(false)
  })

  test('returns false when there are no invoices for the sequence', async () => {
    mockDb.builder.resolves([])
    expect(await allImpsAcknowledgementsReceived([], 1, mockDb.trx)).toBe(false)
  })
})
