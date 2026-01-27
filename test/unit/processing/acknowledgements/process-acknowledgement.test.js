jest.mock('../../../../app/messaging')
jest.mock('../../../../app/storage')
jest.mock('../../../../app/processing/returns/imps/create-imps-return-file')
jest.mock('../../../../app/processing/acknowledgements/is-imps-acknowledgement-file')
jest.mock('../../../../app/processing/acknowledgements/save-imps-acknowledgements')
jest.mock('../../../../app/processing/acknowledgements/parse-acknowledgement-file')
jest.mock('../../../../app/processing/quarantine-file')

const { sendAcknowledgementMessages } = require('../../../../app/messaging')
const { downloadFile, archiveFile } = require('../../../../app/storage')
const { createImpsReturnFile } = require('../../../../app/processing/returns/imps/create-imps-return-file')
const { isImpsAcknowledgementFile } = require('../../../../app/processing/acknowledgements/is-imps-acknowledgement-file')
const { saveImpsAcknowledgements } = require('../../../../app/processing/acknowledgements/save-imps-acknowledgements')
const { parseAcknowledgementFile } = require('../../../../app/processing/acknowledgements/parse-acknowledgement-file')
const { quarantineFile } = require('../../../../app/processing/quarantine-file')
const config = require('../../../../app/config')
const { processAcknowledgement } = require('../../../../app/processing/acknowledgements/process-acknowledgement')

const filename = 'mock_0001_Ack.xml'
const fileContent = 'mock-file-content'
const messages = ['mock-message']
const transaction = 'mock-transaction'

describe('process acknowledgement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    downloadFile.mockResolvedValue(fileContent)
    parseAcknowledgementFile.mockResolvedValue(messages)
    isImpsAcknowledgementFile.mockReturnValue(false)
    saveImpsAcknowledgements.mockResolvedValue(true)
  })

  test('downloads and parses file, sends messages, archives file', async () => {
    await processAcknowledgement(filename, transaction)
    expect(downloadFile).toHaveBeenCalledWith(filename)
    expect(parseAcknowledgementFile).toHaveBeenCalledWith(fileContent, filename)
    expect(sendAcknowledgementMessages).toHaveBeenCalledWith(messages)
    expect(archiveFile).toHaveBeenCalledWith(filename)
  })

  test('quarantines file on parse error', async () => {
    const parseError = new Error('parse error')
    parseAcknowledgementFile.mockRejectedValue(parseError)
    await processAcknowledgement(filename, transaction)
    expect(quarantineFile).toHaveBeenCalledWith(filename, parseError)
  })

  test.each([
    [true, true, true],
    [true, false, false],
    [false, true, false],
    [false, false, false]
  ])(
    'IMPS return file creation: isIMPS=%s, hasMessages=%s -> expected=%s',
    async (isIMPS, hasMessages, expected) => {
      isImpsAcknowledgementFile.mockReturnValue(isIMPS)
      parseAcknowledgementFile.mockResolvedValue(hasMessages ? messages : [])
      await processAcknowledgement(filename, transaction)

      if (expected) {
        expect(createImpsReturnFile).toHaveBeenCalledWith(messages, transaction)
      } else expect(createImpsReturnFile).not.toHaveBeenCalled()
    }
  )

  test.each([
    [true],
    [true],
    [false],
    [false]
  ])(
    'saveImpsAcknowledgements called if IMPS: isIMPS=%s',
    async (isIMPS) => {
      isImpsAcknowledgementFile.mockReturnValue(isIMPS)
      await processAcknowledgement(filename, transaction)

      if (isIMPS) {
        expect(saveImpsAcknowledgements).toHaveBeenCalledWith(messages, transaction)
      } else expect(saveImpsAcknowledgements).not.toHaveBeenCalled()
    }
  )
})
