const { createKnexMock, createQueryBuilder } = require('../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsBatchNumbers', 'impsAcknowledgements'])

jest.mock('../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { saveImpsAcknowledgements } = require('../../../../app/processing/acknowledgements/save-imps-acknowledgements')

describe('saveImpsAcknowledgements (query construction)', () => {
  const content = [{ invoiceNumber: 'INV001', frn: 1, success: true }]

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    jest.spyOn(console, 'error').mockImplementation(() => {})
    mockDb.tables.impsBatchNumbers.mockReset()
    mockDb.builder.resolves()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('inserts acknowledgements using the transaction', async () => {
    mockDb.tables.impsBatchNumbers.mockReturnValue(createQueryBuilder().resolves({ batchNumber: '1' }))

    await saveImpsAcknowledgements(content, mockDb.trx)

    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.tables.impsAcknowledgements).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.insert).toHaveBeenCalledWith([{ batchNumber: '1', invoiceNumber: 'INV001', frn: 1, success: 'I' }])
  })

  test('uses no transaction when none supplied', async () => {
    mockDb.tables.impsBatchNumbers.mockReturnValue(createQueryBuilder().resolves({ batchNumber: '1' }))

    await saveImpsAcknowledgements([{ ...content[0], success: false }])

    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(undefined)
    expect(mockDb.tables.impsAcknowledgements).toHaveBeenCalledWith(undefined)
    expect(mockDb.builder.insert).toHaveBeenCalledWith([expect.objectContaining({ success: 'R' })])
  })

  test('does not insert when no batch record is found', async () => {
    mockDb.tables.impsBatchNumbers.mockReturnValue(createQueryBuilder().resolves(undefined))

    await saveImpsAcknowledgements(content, mockDb.trx)

    expect(mockDb.builder.insert).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith('No IMPS acknowledgements to save')
  })
})
