const { parseGlosReturnFile } = require('../../../../app/processing/returns/parse-glos-return-file')

const glosFilename = require('../../../mocks/filenames').GLOS

let glosContent = '106172753,1102259241,EWCO285-21-22,97,20/06/2023,2137.91,1848061,6926,0729,D,'

let mappedContent

describe('parse return file', () => {
  beforeEach(async () => {
    jest.resetAllMocks()
  })

  test('Should return mapped glos content when filename and content provided', async () => {
    glosContent = '106172753,1102259241,EWCO285-21-22,97,20/06/2023,2137.91,1848061,6926,0729,D,'
    mappedContent = [{
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
      referenceId: '17663901d26a85a19de057e2d75253b3',
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should return settlement date as undefined when filename and content with no settlement date provided', async () => {
    glosContent = '106172753,1102259241,EWCO285-21-22,97,,2137.91,1848061,6926,0729,D,'
    mappedContent = [{
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
      referenceId: '6fafa5c91314cc5214d269e8ef4bb3d9',
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should return empty array when content does not contain lines containing ,', async () => {
    glosContent = '[####]'
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual([])
  })

  test('Should correctly parse CSV line with quoted value containing commas', async () => {
    glosContent = '106172753,1102259241,"EWCO,285-21-22",97,20/06/2023,2137.91,1848061,6926,0729,D,'
    mappedContent = [{
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
      referenceId: 'a92283e0c15a6ae2f0b8852283b74d2c',
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should handle all empty fields correctly', async () => {
    glosContent = ',,,,,,,,,,,'
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual([{
      agreementNumber: '',
      bankAccount: '',
      batchNumber: '',
      claimNumber: '',
      detail: '',
      filename: 'FCAP_sequence_RPA_20230621 21008.dat',
      frn: 0,
      ledger: 'AP',
      reference: '',
      referenceId: '9f9086154feb22e06c309103c1e54d16',
      sbi: 0,
      settled: false,
      settlementDate: undefined,
      sourceSystem: 'GLOS',
      value: 0
    }])
  })

  test('Should handle incorrectly quoted fields', async () => {
    glosContent = '106172753,1102259241,"EWCO285-21-22,97,20/06/2023,2137.91,1848061,6926,0729,D,'
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual([])
  })

  test('Should handle extra commas correctly', async () => {
    glosContent = '106172753,1102259241,EWCO285-21-22,97,,2137.91,1848061,6926,0729,D,,,'
    mappedContent = [{
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
      referenceId: expect.any(String),
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should correctly parse numeric fields as strings', async () => {
    glosContent = '106172753,"1102259241","EWCO285-21-22","97","20/06/2023","2137.91","1848061","6926","0729","D",""'
    mappedContent = [{
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
      referenceId: expect.any(String),
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should return null for invalid settlement date format', async () => {
    glosContent = '106172753,1102259241,EWCO285-21-22,97,invalid_date,2137.91,1848061,6926,0729,D,'
    mappedContent = [{
      sourceSystem: 'GLOS',
      sbi: 106172753,
      frn: 1102259241,
      agreementNumber: 'EWCO285-21-22',
      claimNumber: '97',
      settlementDate: null,
      value: 213791,
      reference: '1848061',
      bankAccount: '6926',
      batchNumber: '0729',
      settled: true,
      detail: '',
      ledger: 'AP',
      referenceId: expect.any(String),
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should handle quoted fields with escaped quotes', async () => {
    glosContent = '106172753,1102259241,"EWCO285-21-22 ""Test""",97,20/06/2023,2137.91,1848061,6926,0729,D,'
    mappedContent = [{
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
      referenceId: expect.any(String),
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })

  test('Should handle large numbers correctly', async () => {
    glosContent = '106172753,1102259241,EWCO285-21-22,97,20/06/2023,9999999999.99,1848061,6926,0729,D,'
    mappedContent = [{
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
      referenceId: expect.any(String),
      filename: glosFilename
    }]
    const result = parseGlosReturnFile([glosContent], glosFilename)
    expect(result).toStrictEqual(mappedContent)
  })
})
