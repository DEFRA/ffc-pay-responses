const db = require('../../../../../app/database')
const { truncate } = require('../../../../helpers/truncate')
jest.useFakeTimers()

const { setImpsAcknowledgementsExported } = require('../../../../../app/processing/returns/imps/set-imps-acknowledgements-exported')

describe('set IMPS acknowledgements exported', () => {
  let transaction

  beforeEach(async () => {
    transaction = await db.transaction()
    await db.impsAcknowledgements(transaction).insert([
      { impsAcknowledgementId: 1, batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 },
      { impsAcknowledgementId: 2, batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891 },
      { impsAcknowledgementId: 3, batchNumber: '2', invoiceNumber: 'S123456789C123456V001', frn: 1234567892 }
    ])
  })

  afterEach(async () => {
    await transaction.rollback()
    jest.clearAllMocks()
    await truncate()
  })

  test('sets exported date only for specified acknowledgements', async () => {
    const acknowledgements = [{ impsAcknowledgementId: 1 }, { impsAcknowledgementId: 2 }]
    await setImpsAcknowledgementsExported(acknowledgements, transaction)

    const updated = await db.impsAcknowledgements(transaction).whereIn('impsAcknowledgementId', [1, 2])
    expect(updated.every(ack => ack.exported)).toBe(true)

    const notUpdated = (await db.impsAcknowledgements(transaction).where({ impsAcknowledgementId: 3 }).first()) ?? null
    expect(notUpdated.exported).toBeNull()
  })
})
