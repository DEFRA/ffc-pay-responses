const { parseGenesisReturnFile } = require('../../../../app/processing/returns/parse-genesis-return-file')
const genesisFilename = require('../../../mocks/filenames').GENESIS

describe('parseGenesisReturnFile', () => {
  const testCases = [
    {
      description: 'returns mapped genesis content when settlement date is present',
      content: 'D^1098608^AG00384621^1216.00^20/07/2023^B^1892661^D^',
      expected: [{
        sourceSystem: 'Genesis',
        paymentId: '1098608',
        transactionNumber: 'AG00384621',
        value: 121600,
        settlementDate: '2023-07-20T00:00:00.000Z',
        paymentType: 'B',
        reference: '1892661',
        settled: true,
        detail: '',
        ledger: 'AP',
        referenceId: '32507ddd91b3f6a0ca49549e7de2bc11',
        filename: genesisFilename
      }]
    },
    {
      description: 'returns mapped content with undefined settlement date when not provided',
      content: 'D^1098608^AG00384621^1216.00^^B^1892661^D^',
      expected: [{
        sourceSystem: 'Genesis',
        paymentId: '1098608',
        transactionNumber: 'AG00384621',
        value: 121600,
        settlementDate: undefined,
        paymentType: 'B',
        reference: '1892661',
        settled: true,
        detail: '',
        ledger: 'AP',
        referenceId: 'deb03d156ec31d0b44b3d76b308cb825',
        filename: genesisFilename
      }]
    },
    {
      description: 'returns empty array when no data lines present',
      content: 'H^21/07/2023^3^44927.18^[####]',
      expected: []
    }
  ]

  test.each(testCases)('$description', ({ content, expected }) => {
    const result = parseGenesisReturnFile([content], genesisFilename)
    expect(result).toStrictEqual(expected)
  })
})
