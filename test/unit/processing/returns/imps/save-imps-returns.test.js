const { createKnexMock } = require('../../../../helpers/mock-knex')
const mockDb = createKnexMock(['impsReturns'])

jest.mock('../../../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { saveImpsReturns } = require('../../../../../app/processing/returns/imps/save-imps-returns')

describe('saveImpsReturns', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, 'log').mockImplementation(() => {})
    mockDb.builder.resolves()
  })

  afterEach(() => {
    console.log.mockRestore()
  })

  const line = 'H,1,04,Trader1,INV001,P,Ref001,1.23,T,2024-04-19,321.00,'

  test('inserts only H lines, converting GBP value to pence', async () => {
    await saveImpsReturns(['B,04,0001,1,1.23,S', line], mockDb.trx)

    expect(mockDb.tables.impsReturns).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.insert).toHaveBeenCalledWith([{
      trader: 'Trader1',
      invoiceNumber: 'INV001',
      status: 'P',
      paymentReference: 'Ref001',
      valueGBP: 123,
      paymentType: 'T',
      dateSettled: '2024-04-19',
      valueEUR: '321.00'
    }])
    expect(console.log).toHaveBeenCalledWith('Saved 1 IMPS returns ready for next acknowledgement response')
  })

  test('uses no transaction when none supplied', async () => {
    await saveImpsReturns([line])
    expect(mockDb.tables.impsReturns).toHaveBeenCalledWith(undefined)
  })

  test('does not insert when there are no H lines', async () => {
    await saveImpsReturns(['B,04,0001,0,0.00,S'], mockDb.trx)
    expect(mockDb.builder.insert).not.toHaveBeenCalled()
    expect(console.log).toHaveBeenCalledWith('Saved 0 IMPS returns ready for next acknowledgement response')
  })
})
