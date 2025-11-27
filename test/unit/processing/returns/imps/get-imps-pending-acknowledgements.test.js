const db = require('../../../../../app/data')
jest.useFakeTimers()
const { getImpsPendingAcknowledgements } = require('../../../../../app/processing/returns/imps/get-imps-pending-acknowledgements')

describe('get IMPS pending acknowledgements', () => {
  let transaction

  const ackData = [
    { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890, exported: null },
    { batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891, exported: null },
    { batchNumber: '2', invoiceNumber: 'S123456789C123456V001', frn: 1234567892, exported: null },
    { batchNumber: '3', invoiceNumber: 'S123456789D123456V001', frn: 1234567893, exported: null },
    { batchNumber: '4', invoiceNumber: 'S123456789E123456V001', frn: 1234567894, exported: new Date() }
  ]

  beforeEach(async () => {
    transaction = await db.sequelize.transaction()
    await db.impsAcknowledgement.bulkCreate(ackData, { transaction })
  })

  afterEach(async () => {
    await transaction.rollback()
    jest.clearAllMocks()
    await db.impsAcknowledgement.destroy({ where: {}, truncate: true })
  })

  test.each([
    [2, ['S123456789A123456V001', 'S123456789B123456V001', 'S123456789C123456V001']],
    [4, ['S123456789A123456V001', 'S123456789B123456V001', 'S123456789C123456V001', 'S123456789D123456V001']]
  ])('returns correct pending acknowledgements for sequence %i', async (sequence, expectedInvoices) => {
    const acks = await getImpsPendingAcknowledgements(sequence, transaction)
    const invoices = acks.map(a => a.invoiceNumber)
    expect(invoices).toEqual(expect.arrayContaining(expectedInvoices))
    expect(invoices).not.toContain('S123456789E123456V001')
    expect(invoices.every(inv => ['1', '2', '3'].some(b => inv.includes(b)))).toBe(true)
  })
})
