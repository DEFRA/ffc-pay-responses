const { createKnexMock } = require('../../helpers/mock-knex')
const mockDb = createKnexMock(['impsBatchNumbers'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getExistingImpsSubmission } = require('../../../app/messaging/get-existing-imps-submission')

describe('getExistingImpsSubmission', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('queries with a lock using the supplied transaction', async () => {
    const record = { invoiceNumber: 'INV1', frn: 1, batch: 'B1' }
    mockDb.builder.resolves(record)

    const result = await getExistingImpsSubmission('INV1', 1, 'B1', mockDb.trx)

    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.where).toHaveBeenCalledWith({ invoiceNumber: 'INV1', frn: 1, batch: 'B1' })
    expect(mockDb.builder.forUpdate).toHaveBeenCalled()
    expect(result).toBe(record)
  })

  test('uses no transaction when none supplied', async () => {
    await getExistingImpsSubmission('INV1', 1, 'B1')
    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(undefined)
  })

  test('returns null when transaction is null', async () => {
    const result = await getExistingImpsSubmission('INV1', 1, 'B1', null)
    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(undefined)
    expect(result).toBeNull()
  })
})
