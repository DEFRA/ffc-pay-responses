const db = require('../../../../../app/data')
const { getImpsPendingReturnLines } = require('../../../../../app/processing/returns/imps/get-imps-pending-return-lines')

const pendingReturns = [
  { impsReturnId: '1', trader: 'Trader1', invoiceNumber: 'INV001', status: 'S', paymentReference: 'Ref001', valueGBP: 123, paymentType: 'T', dateSettled: '2024-04-19', valueEUR: '321.00', sequence: 5, exported: null, update: jest.fn() },
  { impsReturnId: '2', trader: 'Trader2', invoiceNumber: 'INV002', status: 'S', paymentReference: 'Ref002', valueGBP: 456, paymentType: 'T', dateSettled: '2024-04-12', valueEUR: '654.00', sequence: 1, exported: null, update: jest.fn() }
]

const mockBatchNumber = { impsBatchNumberId: 1, frn: 1234567890, trader: 'Trader1', invoiceNumber: 'INV001', batch: 'Batch1', batchNumber: 'BAT001' }

describe('get IMPS pending return lines', () => {
  let acknowledgedBatchNumbers

  beforeEach(async () => {
    jest.clearAllMocks()
    acknowledgedBatchNumbers = []
    await db.sequelize.truncate({ cascade: true })
    await db.impsBatchNumber.bulkCreate([mockBatchNumber])
  })

  afterAll(async () => db.sequelize.close())

  test.each([
    [[], ['H,BAT001,04,Trader1,INV001,S,Ref001,1.23,T,2024-04-19,321.00,'], 123],
    [['BAT002'], ['H,BAT001,04,Trader1,INV001,S,Ref001,1.23,T,2024-04-19,321.00,'], 123],
    [['BAT001'], [], 0]
  ])('returns correct lines and total for acknowledged batches %p', async (ackBatches, expectedLines, expectedTotal) => {
    acknowledgedBatchNumbers.push(...ackBatches)
    const result = await getImpsPendingReturnLines(pendingReturns, acknowledgedBatchNumbers)
    expect(result).toEqual({ pendingReturnLines: expectedLines, totalValue: expectedTotal })
    expect(pendingReturns[0].update).toHaveBeenCalled()
  })
})
