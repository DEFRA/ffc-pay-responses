const db = require('../../../../../app/data')
jest.useFakeTimers()

const { allImpsAcknowledgementsReceived } = require('../../../../../app/processing/returns/imps/all-imps-acknowledgements-received')

describe('all IMPS acknowledgements received', () => {
  let transaction

  beforeEach(async () => {
    transaction = await db.sequelize.transaction()

    await db.impsBatchNumber.bulkCreate([
      { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 },
      { batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891 },
      { batchNumber: '1', invoiceNumber: 'S123456789C123456V001', frn: 1234567892 },
      { batchNumber: '1', invoiceNumber: 'S123456789D123456V001', frn: 1234567893 }
    ], { transaction })
  })

  afterEach(async () => {
    await transaction.rollback()
    jest.clearAllMocks()
    await db.impsBatchNumber.destroy({ where: {}, truncate: true })
    await db.impsAcknowledgement.destroy({ where: {}, truncate: true })
  })

  test('returns true if all acknowledgements are received', async () => {
    const acknowledgements = [
      { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 },
      { batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891 },
      { batchNumber: '1', invoiceNumber: 'S123456789C123456V001', frn: 1234567892 },
      { batchNumber: '1', invoiceNumber: 'S123456789D123456V001', frn: 1234567893 }
    ]
    const result = await allImpsAcknowledgementsReceived(acknowledgements, 1, transaction)
    expect(result).toBe(true)
  })

  test('returns false if not all acknowledgements are received', async () => {
    const acknowledgements = [
      { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 },
      { batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891 }
    ]
    const result = await allImpsAcknowledgementsReceived(acknowledgements, 1, transaction)
    expect(result).toBe(false)
  })

  test('returns false if no acknowledgements are received', async () => {
    const acknowledgements = []
    const result = await allImpsAcknowledgementsReceived(acknowledgements, 1, transaction)
    expect(result).toBe(false)
  })

  test('returns false if invoicesForSequence.length is 0', async () => {
    await db.impsBatchNumber.destroy({ where: { batchNumber: '1' }, transaction })
    const acknowledgements = [
      { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 }
    ]
    const result = await allImpsAcknowledgementsReceived(acknowledgements, 1, transaction)
    expect(result).toBe(false)
  })
})
