jest.mock('../../../../app/storage')
jest.mock('../../../../app/processing/returns/parse-return-file')
jest.mock('../../../../app/processing/quarantine-file')
jest.mock('../../../../app/messaging')
jest.mock('../../../../app/processing/returns/imps/is-imps-return-file')
jest.mock('../../../../app/processing/returns/imps/save-imps-returns')
jest.mock('../../../../app/processing/returns/is-genesis-return-file')
jest.mock('../../../../app/processing/returns/create-genesis-return-file')
jest.mock('../../../../app/processing/returns/is-glos-return-file')
jest.mock('../../../../app/processing/returns/create-glos-return-file')

const { downloadFile, archiveFile } = require('../../../../app/storage')
const { parseReturnFile } = require('../../../../app/processing/returns/parse-return-file')
const { quarantineFile } = require('../../../../app/processing/quarantine-file')
const { sendReturnMessages } = require('../../../../app/messaging')
const { isImpsReturnFile } = require('../../../../app/processing/returns/imps/is-imps-return-file')
const { saveImpsReturns } = require('../../../../app/processing/returns/imps/save-imps-returns')
const { isGenesisReturnFile } = require('../../../../app/processing/returns/is-genesis-return-file')
const { createGenesisReturnFile } = require('../../../../app/processing/returns/create-genesis-return-file')
const { isGlosReturnFile } = require('../../../../app/processing/returns/is-glos-return-file')
const { createGlosReturnFile } = require('../../../../app/processing/returns/create-glos-return-file')

const { processReturn } = require('../../../../app/processing/returns/process-return')

const files = {
  default: 'Return File.csv',
  imps: 'RET_IMPS.INT',
  genesis: 'GENESISPayConf.gni',
  glos: 'FCAP RPA.dat'
}

const content = 'file content'
const messages = ['message 1', 'message 2']
const transaction = 'mock-transaction'

describe('processReturn', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    downloadFile.mockResolvedValue(content)
    parseReturnFile.mockReturnValue(messages)
    isImpsReturnFile.mockReturnValue(false)
    isGenesisReturnFile.mockReturnValue(false)
    isGlosReturnFile.mockReturnValue(false)
  })

  test('downloads, parses, sends messages, and archives file', async () => {
    await processReturn(files.default, transaction)
    expect(downloadFile).toHaveBeenCalledWith(files.default)
    expect(parseReturnFile).toHaveBeenCalledWith([content], files.default)
    expect(sendReturnMessages).toHaveBeenCalledWith(messages)
    expect(archiveFile).toHaveBeenCalledWith(files.default)
  })

  test('quarantines file on parse error', async () => {
    parseReturnFile.mockImplementation(() => { throw new Error('parse error') })
    await processReturn(files.default, transaction)
    expect(quarantineFile).toHaveBeenCalledWith(files.default, expect.any(Error))
  })

  test.each([
    [files.imps, isImpsReturnFile, saveImpsReturns, [content], transaction],
    [files.genesis, isGenesisReturnFile, createGenesisReturnFile, [content], files.genesis, transaction],
    [files.glos, isGlosReturnFile, createGlosReturnFile, [content], files.glos, transaction]
  ])('handles %s file type', async (filename, checker, handler, ...args) => {
    checker.mockReturnValue(true)
    await processReturn(filename, transaction)
    expect(handler).toHaveBeenCalledWith(...args)
  })
})
