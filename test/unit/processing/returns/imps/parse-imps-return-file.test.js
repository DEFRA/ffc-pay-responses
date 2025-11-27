const { parseImpsReturnFile } = require('../../../../../app/processing/returns/imps/parse-imps-return-file')
const impsFilename = require('../../../../mocks/filenames').IMPS

describe('parse return file', () => {
  let impsContent, mappedContent

  beforeEach(() => {
    jest.resetAllMocks()
    impsContent = 'H,9942,04,380225,SCM/38022522-210-001,P,1848107,115.45,B,20-JUN-23,0,'
    mappedContent = [{
      sourceSystem: 'IMPS',
      paymentJobNumber: '9942',
      fesCode: '04',
      traderNumber: '380225',
      invoiceNumber: 'SCM/38022522-210-001',
      transactionNumber: 'SCM/38022522-210-001',
      settled: true,
      reference: '1848107',
      value: 11545,
      paymentType: 'B',
      settlementDate: '2023-06-20T00:00:00.000Z',
      valueEUR: 0,
      exchangeRate: '',
      ledger: 'AP',
      referenceId: expect.any(String),
      filename: impsFilename
    }]
  })

  test('maps content correctly', () => {
    const result = parseImpsReturnFile([impsContent], impsFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('returns undefined settlement date if missing', () => {
    impsContent = 'H,9942,04,380225,SCM/38022522-210-001,P,1848107,115.45,B,,0,'
    mappedContent[0].settlementDate = undefined
    const result = parseImpsReturnFile([impsContent], impsFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('returns empty array for non-header lines', () => {
    impsContent = 'B,04,[####],2,205.03,S'
    const result = parseImpsReturnFile([impsContent], impsFilename)
    expect(result).toStrictEqual([])
  })
})
