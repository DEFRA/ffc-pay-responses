const config = require('../../../../../app/config')
const db = require('../../../../../app/data')
const { getImpsAcknowledgementLines } = require('../../../../../app/processing/returns/imps/get-imps-acknowledgement-lines')

const acknowledgements = [
  { invoiceNumber: 'INV001', frn: 1234567890, success: true, batchNumber: '1' },
  { invoiceNumber: 'INV002', frn: 9876543210, success: true, batchNumber: '6' }
]

const mockBatchNumber = {
  impsBatchNumberId: 1,
  frn: 1234567890,
  trader: 'Trader1',
  invoiceNumber: 'INV001',
  batch: 'Batch1',
  batchNumber: '1'
}

describe('get IMPS acknowledgement lines', () => {
  let transaction

  beforeAll(async () => {
    await db.sequelize.sync({ force: true })
  })

  beforeEach(async () => {
    jest.clearAllMocks()
    transaction = await db.sequelize.transaction()
    await db.impsBatchNumber.bulkCreate([mockBatchNumber], { transaction })
  })

  afterEach(async () => {
    await transaction.rollback()
  })

  afterAll(async () => {
    await db.sequelize.close()
  })

  test.each([
    ['successful acknowledgement', ['H,1,04,Trader1,INV001,I,,,,,,']],
    ['unsuccessful acknowledgement', ['H,1,04,Trader1,INV001,R,,,,,,']],
    ['filter by sequence', ['H,1,04,Trader1,INV001,false,,,,,,']]
  ])('should return correct acknowledgement lines for %s', async (_, expectedLines) => {
    if (_ === 'unsuccessful acknowledgement') {
      acknowledgements[0].success = false
    }

    const sequence = 5

    const result = await getImpsAcknowledgementLines(acknowledgements, sequence, transaction)

    expect(result.acknowledgementLines).toEqual(expectedLines)
  })

  test('should return correct list of batch numbers based on acknowledged data', async () => {
    const result = await getImpsAcknowledgementLines(acknowledgements, 1, transaction)
    expect(result.batchNumbers).toEqual(['1'])
  })
})
