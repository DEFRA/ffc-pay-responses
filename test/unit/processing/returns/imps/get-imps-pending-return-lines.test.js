const { createKnexMock, createQueryBuilder } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsBatchNumbers', 'impsReturns'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { getImpsPendingReturnLines } = require('../../../../../app/processing/returns/imps/get-imps-pending-return-lines')

const pendingReturns = [
  { impsReturnId: '1', trader: 'Trader1', invoiceNumber: 'INV001', status: 'S', paymentReference: 'Ref001', valueGBP: 123, paymentType: 'T', dateSettled: '2024-04-19', valueEUR: '321.00', sequence: 5, exported: null },
  { impsReturnId: '2', trader: 'Trader2', invoiceNumber: 'INV002', status: 'S', paymentReference: 'Ref002', valueGBP: 456, paymentType: 'T', dateSettled: '2024-04-12', valueEUR: '654.00', sequence: 1, exported: null }
]

const mockBatchNumber = { batchNumber: 'BAT001' }

describe('get IMPS pending return lines', () => {
  let acknowledgedBatchNumbers

  beforeEach(() => {
    jest.clearAllMocks()
    acknowledgedBatchNumbers = []
    mockDb.builder.resolves()

    const matchBuilder = createQueryBuilder().resolves(mockBatchNumber)
    const noMatchBuilder = createQueryBuilder().resolves(undefined)
    mockDb.tables.impsBatchNumbers
      .mockReturnValueOnce(matchBuilder)
      .mockReturnValueOnce(noMatchBuilder)
  })

  test.each([
    [[], ['H,BAT001,04,Trader1,INV001,S,Ref001,1.23,T,2024-04-19,321.00,'], 123],
    [['BAT002'], ['H,BAT001,04,Trader1,INV001,S,Ref001,1.23,T,2024-04-19,321.00,'], 123],
    [['BAT001'], [], 0]
  ])('returns correct lines and total for acknowledged batches %p', async (ackBatches, expectedLines, expectedTotal) => {
    acknowledgedBatchNumbers.push(...ackBatches)
    const result = await getImpsPendingReturnLines(pendingReturns, acknowledgedBatchNumbers)
    const shouldUpdate = expectedLines.length > 0

    if (shouldUpdate) {
      expect(mockDb.tables.impsReturns).toHaveBeenCalled()
      expect(mockDb.builder.where).toHaveBeenCalledWith({ impsReturnId: pendingReturns[0].impsReturnId })
      expect(mockDb.builder.update).toHaveBeenCalledWith(expect.objectContaining({ exported: expect.any(Date) }))
    } else {
      expect(mockDb.tables.impsReturns).not.toHaveBeenCalled()
    }

    expect(result).toEqual({ pendingReturnLines: expectedLines, totalValue: expectedTotal })
  })
})
