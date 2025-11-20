const { parseDefaultReturnFile } = require('../../../../app/processing/returns/parse-default-return-file')
const defaultFilename = require('../../../mocks/filenames').DEFAULT

describe('parseDefaultReturnFile', () => {
  const cases = [
    {
      description: 'returns mapped content when settlement date is present',
      content: 'SITI_SFI,S000000200000002V001,1000000002,legacy,05-OCT-22,S,250.00,2022-11-09,PY1711007,D,',
      expected: [{
        sourceSystem: 'SITI_SFI',
        invoiceNumber: 'S000000200000002V001',
        frn: 1000000002,
        currency: 'GBP',
        value: 25000,
        settlementDate: '2022-11-09T00:00:00.000Z',
        reference: 'PY1711007',
        settled: true,
        detail: '',
        ledger: 'AP',
        referenceId: 'e2c759e70bf25e1ffe152c4b70bba9b6',
        filename: defaultFilename
      }]
    },
    {
      description: 'returns mapped content with undefined settlement date when not provided',
      content: 'SITI_SFI,S000000200000002V001,1000000002,legacy,05-OCT-22,S,250.00,,PY1711007,D,',
      expected: [{
        sourceSystem: 'SITI_SFI',
        invoiceNumber: 'S000000200000002V001',
        frn: 1000000002,
        currency: 'GBP',
        value: 25000,
        settlementDate: undefined,
        reference: 'PY1711007',
        settled: true,
        detail: '',
        ledger: 'AP',
        referenceId: 'e47d073218be28dfd7ecb0d0a177de60',
        filename: defaultFilename
      }]
    }
  ]

  test.each(cases)('$description', ({ content, expected }) => {
    const result = parseDefaultReturnFile([content], defaultFilename)
    expect(result).toStrictEqual(expected)
  })
})
