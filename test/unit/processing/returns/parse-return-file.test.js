jest.mock('../../../../app/processing/returns/parse-genesis-return-file')
jest.mock('../../../../app/processing/returns/parse-glos-return-file')
jest.mock('../../../../app/processing/returns/imps/parse-imps-return-file')
jest.mock('../../../../app/processing/returns/parse-default-return-file')

const { parseGenesisReturnFile } = require('../../../../app/processing/returns/parse-genesis-return-file')
const { parseGlosReturnFile } = require('../../../../app/processing/returns/parse-glos-return-file')
const { parseImpsReturnFile } = require('../../../../app/processing/returns/imps/parse-imps-return-file')
const { parseDefaultReturnFile } = require('../../../../app/processing/returns/parse-default-return-file')

const { parseReturnFile } = require('../../../../app/processing/returns/parse-return-file')

const genesisFilename = require('../../../mocks/filenames').GENESIS
const glosFilename = require('../../../mocks/filenames').GLOS
const impsFilename = require('../../../mocks/filenames').IMPS
const defaultFilename = require('../../../mocks/filenames').DEFAULT

const testCases = [
  { content: 'D^1098608^AG00384621^1216.00^20/07/2023^B^1892661^D^', filename: genesisFilename, parser: parseGenesisReturnFile },
  { content: '106172753,1102259241,EWCO285-21-22,97,20/06/2023,2137.91,1848061,6926,0729,D,', filename: glosFilename, parser: parseGlosReturnFile },
  { content: 'H,9942,04,380225,SCM/38022522-210-001,P,1848107,115.45,B,20-JUN-23,0,', filename: impsFilename, parser: parseImpsReturnFile },
  { content: 'SITIAgri,S123456789A123456V001,1234567890,legacy,04-MAY-21,S,406.35,2021-08-27,PY1234567,D,', filename: defaultFilename, parser: parseDefaultReturnFile }
]

describe('parseReturnFile', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test.each(testCases)('calls correct parser for $filename', async ({ content, filename, parser }) => {
    await parseReturnFile(content, filename)
    expect(parser).toHaveBeenCalledWith(content, filename)
  })
})
