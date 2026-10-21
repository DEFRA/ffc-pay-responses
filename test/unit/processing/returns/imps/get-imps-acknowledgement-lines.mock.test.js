const { createKnexMock, createQueryBuilder } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsBatchNumbers'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getImpsAcknowledgementLines } = require('../../../../../app/processing/returns/imps/get-imps-acknowledgement-lines')

describe('getImpsAcknowledgementLines (query construction)', () => {
  const acknowledgement = { invoiceNumber: 'INV001', frn: 1, success: 'I', batchNumber: '1' }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.tables.impsBatchNumbers.mockReset()
  })

  test('builds lines using the transaction when a batch record is found', async () => {
    mockDb.tables.impsBatchNumbers.mockReturnValue(createQueryBuilder().resolves({ batchNumber: '1', trader: 'T1' }))

    const result = await getImpsAcknowledgementLines([acknowledgement], 1, mockDb.trx)

    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(mockDb.trx)
    expect(result).toEqual({ acknowledgementLines: ['H,1,04,T1,INV001,I,,,,,,'], batchNumbers: ['1'] })
  })

  test('uses no transaction and skips acknowledgements without a batch record', async () => {
    mockDb.tables.impsBatchNumbers.mockReturnValue(createQueryBuilder().resolves(undefined))

    const result = await getImpsAcknowledgementLines([acknowledgement], 1)

    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(undefined)
    expect(result).toEqual({ acknowledgementLines: [], batchNumbers: [] })
  })

  test('ignores acknowledgements from later sequences', async () => {
    const result = await getImpsAcknowledgementLines([{ ...acknowledgement, batchNumber: '5' }], 1, mockDb.trx)
    expect(mockDb.tables.impsBatchNumbers).not.toHaveBeenCalled()
    expect(result.batchNumbers).toEqual([])
  })
})
