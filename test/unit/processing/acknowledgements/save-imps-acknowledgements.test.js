const db = require('../../../../app/database')
const { truncate } = require('../../../helpers/truncate')
jest.useFakeTimers()

const { saveImpsAcknowledgements } = require('../../../../app/processing/acknowledgements/save-imps-acknowledgements')

describe('save IMPS acknowledgements', () => {
  let transaction

  beforeEach(async () => {
    transaction = await db.transaction()

    await db.impsBatchNumbers(transaction).insert([
      { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 },
      { batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891 },
      { batchNumber: '1', invoiceNumber: 'S123456789C123456V001', frn: 1234567892 },
      { batchNumber: '1', invoiceNumber: 'S123456789D123456V001', frn: 1234567893 }
    ])
  })

  afterEach(async () => {
    await transaction.rollback()
    jest.clearAllMocks()
    await truncate()
  })

  test('saves acknowledgements successfully', async () => {
    const content = [
      { invoiceNumber: 'S123456789A123456V001', frn: 1234567890, success: true },
      { invoiceNumber: 'S123456789B123456V001', frn: 1234567891, success: false },
      { invoiceNumber: 'S123456789C123456V001', frn: 1234567892, success: true },
      { invoiceNumber: 'S123456789D123456V001', frn: 1234567893, success: false }
    ]

    await saveImpsAcknowledgements(content, transaction)

    const acknowledgements = await db.impsAcknowledgements(transaction)
    expect(acknowledgements.length).toBe(4)
    expect(acknowledgements[0].invoiceNumber).toBe('S123456789A123456V001')
    expect(acknowledgements[0].success).toBe('I')
    expect(acknowledgements[1].invoiceNumber).toBe('S123456789B123456V001')
    expect(acknowledgements[1].success).toBe('R')
  })

  test('logs error and continues if batch number not found', async () => {
    const content = [
      { invoiceNumber: 'S123456789E123456V001', frn: 1234567894, success: true }
    ]

    console.error = jest.fn()

    await saveImpsAcknowledgements(content, transaction)

    expect(console.error).toHaveBeenCalledWith('No batch number found for invoiceNumber: S123456789E123456V001, frn: 1234567894')

    const acknowledgements = await db.impsAcknowledgements(transaction)
    expect(acknowledgements.length).toBe(0)
  })
})
