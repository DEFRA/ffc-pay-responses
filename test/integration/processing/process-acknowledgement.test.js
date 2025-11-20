const db = require('../../../app/data')
const path = require('path')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config')
const processing = require('../../../app/processing')
const { IMPS, ES, FC } = require('../../../app/constants/schemes')

jest.useRealTimers()

const mockSendBatchMessages = jest.fn()
jest.mock('ffc-messaging', () => ({
  MessageBatchSender: jest.fn().mockImplementation(() => ({
    sendBatchMessages: mockSendBatchMessages,
    closeConnection: jest.fn()
  }))
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: jest.fn().mockImplementation(() => ({
    publishEvent: jest.fn()
  }))
}))

const TEST_FILE = path.resolve(__dirname, '../../files/acknowledgement.xml')
const TEST_INVALID_FILE = path.resolve(__dirname, '../../files/broken-acknowledgement.xml')
const VALID_FILENAME = 'mock_0001_Ack.xml'
const INVALID_FILENAME = 'ignore me.xml'
const IMPS_FILENAME = 'mock_IMPS_0001_Ack.xml'

let container

const uploadFile = async (filename, filePath) => {
  const blobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${filename}`)
  await blobClient.uploadFile(filePath)
}

const listBlobs = async (prefix = '') => {
  const files = []
  for await (const blob of container.listBlobsFlat({ prefix })) {
    files.push(blob.name)
  }
  return files
}

describe('process acknowledgement', () => {
  beforeEach(async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(config.storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    await uploadFile(VALID_FILENAME, TEST_FILE)

    const existingSchemes = await db.scheme.findAll({ where: { schemeId: [ES, FC, IMPS] } })
    if (!existingSchemes.length) {
      await db.scheme.bulkCreate([{ schemeId: ES, name: 'ES' }, { schemeId: FC, name: 'FC' }, { schemeId: IMPS, name: 'IMPS' }])
      await db.sequence.bulkCreate([{ schemeId: ES, nextReturn: 1 }, { schemeId: FC, nextReturn: 1 }, { schemeId: IMPS, nextReturn: 1 }])
    }

    await db.impsBatchNumber.bulkCreate([
      { batchNumber: '1', invoiceNumber: 'S123456789A123456V001', frn: 1234567890 },
      { batchNumber: '1', invoiceNumber: 'S123456789B123456V001', frn: 1234567891 },
      { batchNumber: '1', invoiceNumber: 'S123456789C123456V001', frn: 1234567892 },
      { batchNumber: '1', invoiceNumber: 'S123456789D123456V001', frn: 1234567893 }
    ])
  })

  afterEach(async () => {
    jest.clearAllMocks()
    await db.impsBatchNumber.destroy({ where: { invoiceNumber: 'S123456789E123456V001' }, truncate: true })
    await db.impsAcknowledgement.destroy({ where: {}, truncate: true })
  })

  test('creates IMPS return file if all acknowledgements are received', async () => {
    await uploadFile(IMPS_FILENAME, TEST_FILE)
    await processing.start()
    const files = await listBlobs(config.storageConfig.returnFolder)
    expect(files.some(f => f.startsWith(`${config.storageConfig.returnFolder}/RET_IMPS`))).toBe(true)
  })

  test('ignores unrelated file', async () => {
    await uploadFile(INVALID_FILENAME, TEST_FILE)
    await processing.start()
    const files = await listBlobs()
    expect(files.includes(`${config.storageConfig.inboundFolder}/${INVALID_FILENAME}`)).toBe(true)
  })

  test('quarantines invalid file', async () => {
    await uploadFile(VALID_FILENAME, TEST_INVALID_FILE)
    await processing.start()
    const files = await listBlobs(config.storageConfig.quarantineFolder)
    expect(files.includes(`${config.storageConfig.quarantineFolder}/${VALID_FILENAME}`)).toBe(true)
  })

  test('does not create IMPS return file if acknowledgement is not IMPS', async () => {
    await processing.start()
    const files = await listBlobs(config.storageConfig.returnFolder)
    expect(files.some(f => f.startsWith(`${config.storageConfig.returnFolder}/RET_IMPS`))).toBe(false)
  })

  test('does not quarantine file if unable to publish valid message', async () => {
    mockSendBatchMessages.mockImplementation(() => { throw new Error('Unable to publish message') })
    await processing.start()
    const files = await listBlobs()
    expect(files.includes(`${config.storageConfig.inboundFolder}/${VALID_FILENAME}`)).toBe(true)
  })

  describe('sends acknowledgement messages', () => {
    beforeEach(async () => { await processing.start() })

    test('sends all acknowledgements', () => {
      expect(mockSendBatchMessages.mock.calls[0][0].length).toBe(4)
    })

    test.each([
      [0, 'S123456789A123456V001', 1234567890, true, VALID_FILENAME, null],
      [2, null, null, false, null, 'Journal JN12345678 has been created Validation failed Line : 21.'],
      [3, null, null, false, null, 'Invalid bank details']
    ])('sends correct details for message index %i', (index, invoice, frn, success, filename, message) => {
      const body = mockSendBatchMessages.mock.calls[0][0][index].body
      if (invoice) expect(body.invoiceNumber).toBe(invoice)
      if (frn) expect(body.frn).toBe(frn)
      if (success !== null) expect(body.success).toBe(success)
      if (filename) expect(body.filename).toBe(filename)
      if (message) expect(body.message).toBe(message)
    })
  })
})
