const parseDefaultReturnFile = require('../../../app/processing/parse-default-return-file')

const defaultFilename = require('../../mocks/filenames').DEFAULT

let content = 'SITIAgri,S123456789A123456V001,1234567890,legacy,04-MAY-21,S,406.35,2021-08-27,PY1234567,D,'

let mappedContent

describe('parse return file', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
  })

  test('Should return mapped content when filename and content provided', async () => {
    mappedContent = [{
      sourceSystem: 'SITIAgri',
      invoiceNumber: 'S123456789A123456V001',
      frn: 1234567890,
      currency: 'GBP',
      value: 40635,
      settlementDate: '2021-08-27T00:00:00.000Z',
      reference: 'PY1234567',
      settled: true,
      detail: '',
      ledger: 'AP',
      filename: defaultFilename
    }]
    const result = parseDefaultReturnFile([content], defaultFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should return settlement date as undefined when filename and content with no settlement date provided', async () => {
    content = 'SITIAgri,S123456789A123456V001,1234567890,legacy,04-MAY-21,S,406.35,,PY1234567,D,'
    mappedContent = [{
      sourceSystem: 'SITIAgri',
      invoiceNumber: 'S123456789A123456V001',
      frn: 1234567890,
      currency: 'GBP',
      value: 40635,
      settlementDate: undefined,
      reference: 'PY1234567',
      settled: true,
      detail: '',
      ledger: 'AP',
      filename: defaultFilename
    }]
    const result = parseDefaultReturnFile([content], defaultFilename)
    expect(result).toStrictEqual(mappedContent)
  })
})
