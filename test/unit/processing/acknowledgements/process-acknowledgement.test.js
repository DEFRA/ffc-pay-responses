jest.mock('../../../../app/messaging')
const { sendAcknowledgementMessages } = require('../../../../app/messaging')

jest.mock('../../../../app/storage')
const { downloadFile, archiveFile } = require('../../../../app/storage')

jest.mock('../../../../app/processing/returns/imps/create-imps-return-file')
const { createImpsReturnFile } = require('../../../../app/processing/returns/imps/create-imps-return-file')

jest.mock('../../../../app/processing/acknowledgements/is-imps-acknowledgement-file')
const { isImpsAcknowledgementFile } = require('../../../../app/processing/acknowledgements/is-imps-acknowledgement-file')

jest.mock('../../../../app/processing/acknowledgements/save-imps-acknowledgements')
const { saveImpsAcknowledgements } = require('../../../../app/processing/acknowledgements/save-imps-acknowledgements')

jest.mock('../../../../app/processing/acknowledgements/parse-acknowledgement-file')
const { parseAcknowledgementFile } = require('../../../../app/processing/acknowledgements/parse-acknowledgement-file')

jest.mock('../../../../app/processing/quarantine-file')
const { quarantineFile } = require('../../../../app/processing/quarantine-file')

const config = require('../../../../app/config')
const { processAcknowledgement } = require('../../../../app/processing/acknowledgements/process-acknowledgement')

const filename = 'mock_0001_Ack.xml'
const fileContent = 'mock-file-content'
const messages = ['mock-message']
const transaction = 'mock-transaction'

describe('process acknowledgement', () => {
  afterEach(() => {
    jest.clearAllMocks()
    downloadFile.mockResolvedValue(fileContent)
    parseAcknowledgementFile.mockResolvedValue(messages)
    isImpsAcknowledgementFile.mockReturnValue(false)
    saveImpsAcknowledgements.mockResolvedValue(true)
  })

  test('downloads file content', async () => {
    await processAcknowledgement(filename, transaction)
    expect(downloadFile).toHaveBeenCalledWith(filename)
  })

  test('parses file content', async () => {
    await processAcknowledgement(filename, transaction)
    expect(parseAcknowledgementFile).toHaveBeenCalledWith(fileContent, filename)
  })

  test('quarantines file if parse error', async () => {
    parseAcknowledgementFile.mockRejectedValue(new Error('parse error'))
    await processAcknowledgement(filename, transaction)
    expect(quarantineFile).toHaveBeenCalledWith(filename, new Error('parse error'))
  })

  test('does not quarantine file if no parsing error', async () => {
    await processAcknowledgement(filename, transaction)
    expect(quarantineFile).not.toHaveBeenCalled()
  })

  test('checks if file is IMPS acknowledgement', async () => {
    await processAcknowledgement(filename, transaction)
    expect(isImpsAcknowledgementFile).toHaveBeenCalledWith(filename)
  })

  test('sends acknowledgement messages if acknowledgements in file', async () => {
    await processAcknowledgement(filename, transaction)
    expect(sendAcknowledgementMessages).toHaveBeenCalledWith(messages)
  })

  test('does not send acknowledgement messages if no acknowledgements in file', async () => {
    parseAcknowledgementFile.mockResolvedValue([])
    await processAcknowledgement(filename, transaction)
    expect(sendAcknowledgementMessages).not.toHaveBeenCalled()
  })

  test('creates IMPS return file if file is IMPS acknowledgement and acknowledgements in file', async () => {
    isImpsAcknowledgementFile.mockReturnValue(true)
    await processAcknowledgement(filename, transaction)
    expect(createImpsReturnFile).toHaveBeenCalledWith(messages, transaction)
  })

  test('does not create IMPS return file if file is IMPS acknowledgement but no acknowledgements in file', async () => {
    isImpsAcknowledgementFile.mockReturnValue(true)
    parseAcknowledgementFile.mockResolvedValue([])
    await processAcknowledgement(filename, transaction)
    expect(createImpsReturnFile).not.toHaveBeenCalled()
  })

  test('does not create IMPS return file if file is not IMPS acknowledgement file', async () => {
    await processAcknowledgement(filename, transaction)
    expect(createImpsReturnFile).not.toHaveBeenCalled()
  })

  test('archives file if acknowledgements in file', async () => {
    await processAcknowledgement(filename, transaction)
    expect(archiveFile).toHaveBeenCalledWith(filename)
  })

  test('calls saveImpsAcknowledgements if file is IMPS acknowledgement and useV2ReturnFiles is true', async () => {
    isImpsAcknowledgementFile.mockReturnValue(true)
    config.useV2ReturnFiles = true
    await processAcknowledgement(filename, transaction)
    expect(saveImpsAcknowledgements).toHaveBeenCalledWith(messages, transaction)
  })

  test('does not call saveImpsAcknowledgements if file is IMPS acknowledgement and useV2ReturnFiles is false', async () => {
    isImpsAcknowledgementFile.mockReturnValue(true)
    config.useV2ReturnFiles = false
    await processAcknowledgement(filename, transaction)
    expect(saveImpsAcknowledgements).not.toHaveBeenCalled()
  })

  test('does not call saveImpsAcknowledgements if file is not IMPS acknowledgement', async () => {
    isImpsAcknowledgementFile.mockReturnValue(false)
    await processAcknowledgement(filename, transaction)
    expect(saveImpsAcknowledgements).not.toHaveBeenCalled()
  })
})
