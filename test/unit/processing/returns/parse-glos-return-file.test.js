const { parseGlosReturnFile } = require('../../../../app/processing/returns/parse-glos-return-file')
const glosFilename = require('../../../mocks/filenames').GLOS

describe('parseGlosReturnFile', () => {
  const testCases = [
    {
      description: 'maps content correctly with settlement date',
      content: '106172753,1102259241,EWCO285-21-22,97,20/06/2023,2137.91,1848061,6926,0729,D,',
      expected: {
        sourceSystem: 'GLOS',
        sbi: 106172753,
        frn: 1102259241,
        agreementNumber: 'EWCO285-21-22',
        claimNumber: '97',
        settlementDate: '2023-06-20T00:00:00.000Z',
        value: 213791,
        reference: '1848061',
        bankAccount: '6926',
        batchNumber: '0729',
        settled: true,
        detail: '',
        ledger: 'AP',
        filename: glosFilename
      }
    },
    {
      description: 'maps content correctly with undefined settlement date',
      content: '106172753,1102259241,EWCO285-21-22,97,,2137.91,1848061,6926,0729,D,',
      expected: {
        sourceSystem: 'GLOS',
        sbi: 106172753,
        frn: 1102259241,
        agreementNumber: 'EWCO285-21-22',
        claimNumber: '97',
        settlementDate: undefined,
        value: 213791,
        reference: '1848061',
        bankAccount: '6926',
        batchNumber: '0729',
        settled: true,
        detail: '',
        ledger: 'AP',
        filename: glosFilename
      }
    },
    {
      description: 'returns empty array for non-data content',
      content: '[####]',
      expected: null
    },
    {
      description: 'parses quoted value with comma',
      content: '106172753,1102259241,"EWCO,285-21-22",97,20/06/2023,2137.91,1848061,6926,0729,D,',
      expected: {
        sourceSystem: 'GLOS',
        sbi: 106172753,
        frn: 1102259241,
        agreementNumber: 'EWCO,285-21-22',
        claimNumber: '97',
        settlementDate: '2023-06-20T00:00:00.000Z',
        value: 213791,
        reference: '1848061',
        bankAccount: '6926',
        batchNumber: '0729',
        settled: true,
        detail: '',
        ledger: 'AP',
        filename: glosFilename
      }
    },
    {
      description: 'handles incorrectly quoted fields',
      content: '106172753,1102259241,"EWCO285-21-22,97,20/06/2023,2137.91,1848061,6926,0729,D,',
      expected: null
    },
    {
      description: 'handles extra commas',
      content: '106172753,1102259241,EWCO285-21-22,97,,2137.91,1848061,6926,0729,D,,,',
      expected: {
        sourceSystem: 'GLOS',
        sbi: 106172753,
        frn: 1102259241,
        agreementNumber: 'EWCO285-21-22',
        claimNumber: '97',
        settlementDate: undefined,
        value: 213791,
        reference: '1848061',
        bankAccount: '6926',
        batchNumber: '0729',
        settled: true,
        detail: '',
        ledger: 'AP',
        filename: glosFilename
      }
    },
    {
      description: 'handles quoted fields with escaped quotes',
      content: '106172753,1102259241,"EWCO285-21-22 ""Test""",97,20/06/2023,2137.91,1848061,6926,0729,D,',
      expected: {
        sourceSystem: 'GLOS',
        sbi: 106172753,
        frn: 1102259241,
        agreementNumber: 'EWCO285-21-22 Test',
        claimNumber: '97',
        settlementDate: '2023-06-20T00:00:00.000Z',
        value: 213791,
        reference: '1848061',
        bankAccount: '6926',
        batchNumber: '0729',
        settled: true,
        detail: '',
        ledger: 'AP',
        filename: glosFilename
      }
    },
    {
      description: 'handles large numbers',
      content: '106172753,1102259241,EWCO285-21-22,97,20/06/2023,9999999999.99,1848061,6926,0729,D,',
      expected: {
        sourceSystem: 'GLOS',
        sbi: 106172753,
        frn: 1102259241,
        agreementNumber: 'EWCO285-21-22',
        claimNumber: '97',
        settlementDate: '2023-06-20T00:00:00.000Z',
        value: 999999999999,
        reference: '1848061',
        bankAccount: '6926',
        batchNumber: '0729',
        settled: true,
        detail: '',
        ledger: 'AP',
        filename: glosFilename
      }
    }
  ]

  test.each(testCases)('$description', ({ content, expected }) => {
    const result = parseGlosReturnFile([content], glosFilename)
    if (expected === null) {
      expect(result).toStrictEqual([])
    } else {
      result.forEach(r => expect(r.referenceId).toEqual(expect.any(String)))
      const resultWithoutRefId = result.map(({ referenceId, ...rest }) => rest)
      expect(resultWithoutRefId).toStrictEqual([expected])
    }
  })
})
