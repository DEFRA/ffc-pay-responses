const db = require('../../../app/data')
jest.useFakeTimers()

const mockSendBatchMessages = jest.fn()
jest.mock('ffc-messaging', () => {
  return {
    MessageBatchSender: jest.fn().mockImplementation(() => {
      return {
        sendBatchMessages: mockSendBatchMessages,
        closeConnection: jest.fn()
      }
    })
  }
})

jest.mock('ffc-pay-event-publisher', () => {
  return {
    EventPublisher: jest.fn().mockImplementation(() => {
      return {
        publishEvent: jest.fn()
      }
    })
  }
})

const { BlobServiceClient } = require('@azure/storage-blob')
const path = require('path')

const config = require('../../../app/config')
const processing = require('../../../app/processing')
const { IMPS, ES, FC } = require('../../../app/constants/schemes')

const TEST_FILE = path.resolve(__dirname, '../../files/acknowledgement.xml')
const TEST_INVALID_FILE = path.resolve(__dirname, '../../files/broken-acknowledgement.xml')

const VALID_FILENAME = 'mock_0001_Ack.xml'
const INVALID_FILENAME = 'ignore me.xml'

const IMPS_FILENAME = 'mock_IMPS_0001_Ack.xml'

let blobServiceClient
let container

describe('process acknowledgement', () => {
  beforeEach(async () => {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(config.storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${VALID_FILENAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)

    const existingSchemes = await db.scheme.findAll({
      where: {
        schemeId: [ES, FC, IMPS]
      }
    })
    if (existingSchemes.length === 0) {
      await db.scheme.bulkCreate([
        { schemeId: ES, name: 'ES' },
        { schemeId: FC, name: 'FC' },
        { schemeId: IMPS, name: 'IMPS' }
      ])
      await db.sequence.bulkCreate([
        { schemeId: ES, nextReturn: 1 },
        { schemeId: FC, nextReturn: 1 },
        { schemeId: IMPS, nextReturn: 1 }
      ])
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
    await db.impsAcknowledgement.destroy({ where: { }, truncate: true })
  })

  test('creates IMPS return file if all acknowledgements are received', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${IMPS_FILENAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.returnFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x.startsWith(`${config.storageConfig.returnFolder}/RET_IMPS`)).length).toBe(1)
  })

  test('sends all acknowledgements if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0].length).toBe(4)
  })

  test('sends invoice number if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][0].body.invoiceNumber).toBe('S123456789A123456V001')
  })

  test('sends frn if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][0].body.frn).toBe(1234567890)
  })

  test('sends success if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][0].body.success).toBe(true)
  })

  test('sends failure message for invalid bank details if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][3].body.success).toBe(false)
    expect(mockSendBatchMessages.mock.calls[0][0][3].body.message).toBe('Invalid bank details')
  })

  test('sends failure message for unknown failure if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][2].body.success).toBe(false)
    expect(mockSendBatchMessages.mock.calls[0][0][2].body.message).toBe('Journal JN12345678 has been created Validation failed Line : 21.')
  })

  test('sends filename if file valid', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][0].body.filename).toBe(VALID_FILENAME)
  })

  test('archives file on success if file valid', async () => {
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.archiveFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.archiveFolder}/${VALID_FILENAME}`).length).toBe(1)
  })

  test('ignores unrelated file', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${INVALID_FILENAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat()) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.inboundFolder}/${INVALID_FILENAME}`).length).toBe(1)
  })

  test('quarantines invalid file', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${VALID_FILENAME}`)
    await blockBlobClient.uploadFile(TEST_INVALID_FILE)
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.quarantineFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.quarantineFolder}/${VALID_FILENAME}`).length).toBe(1)
  })

  test('does not create IMPS return file if acknowledgement is not IMPS', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${VALID_FILENAME}`)
    await blockBlobClient.uploadFile(TEST_FILE)
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.returnFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x.startsWith(`${config.storageConfig.returnFolder}/RET_IMPS`)).length).toBe(0)
  })

  test('does not quarantine file if unable to publish valid message', async () => {
    mockSendBatchMessages.mockImplementation(() => { throw new Error('Unable to publish message') })
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat()) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.inboundFolder}/${VALID_FILENAME}`).length).toBe(1)
  })
})
