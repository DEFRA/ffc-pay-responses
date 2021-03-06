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

const mockSendEvent = jest.fn()
jest.mock('ffc-pay-event-publisher', () => {
  return {
    PublishEvent: jest.fn().mockImplementation(() => {
      return {
        sendEvent: mockSendEvent
      }
    })
  }
})

const { BlobServiceClient } = require('@azure/storage-blob')
const path = require('path')

const config = require('../../../app/config')
const processing = require('../../../app/processing')

let blobServiceClient
let container

const TEST_FILE = path.resolve(__dirname, '../../files/return.csv')
const TEST_INVALID_FILE = path.resolve(__dirname, '../../files/broken-return.csv')

describe('process acknowledgement', () => {
  beforeEach(async () => {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(config.storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock Return File.csv`)
    await blockBlobClient.uploadFile(TEST_FILE)
  })

  afterEach(async () => {
    jest.clearAllMocks()
  })

  test('sends all returns', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0].length).toBe(6)
  })

  test('sends invoice number', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][0].body.invoiceNumber).toBe('S123456789A123456V001')
  })

  test('sends settled if D', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][0].body.settled).toBe(true)
  })

  test('sends settled if E with reference', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][4].body.settled).toBe(true)
  })

  test('sends unsettled if E without reference', async () => {
    await processing.start()
    expect(mockSendBatchMessages.mock.calls[0][0][5].body.settled).toBe(false)
  })

  test('archives file on success', async () => {
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.archiveFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.archiveFolder}/mock Return File.csv`).length).toBe(1)
  })

  test('ignores unrelated file', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/ignore me.csv`)
    await blockBlobClient.uploadFile(TEST_FILE)
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.inboundFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.inboundFolder}/ignore me.csv`).length).toBe(1)
  })

  test('quarantines invalid file', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock_0001_Ack.xml`)
    await blockBlobClient.uploadFile(TEST_INVALID_FILE)
    await processing.start()
    const fileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.quarantineFolder })) {
      fileList.push(item.name)
    }
    expect(fileList.filter(x => x === `${config.storageConfig.quarantineFolder}/mock_0001_Ack.xml`).length).toBe(1)
  })

  test('calls PublishEvent.sendEvent once when an invalid file is given', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock_0001_Ack.xml`)
    await blockBlobClient.uploadFile(TEST_INVALID_FILE)

    await processing.start()

    expect(mockSendEvent.mock.calls.length).toBe(1)
  })

  test('calls PublishEvent.sendEvent with event.name "responses-processing-quarantine-error" when an invalid file is given', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock_0001_Ack.xml`)
    await blockBlobClient.uploadFile(TEST_INVALID_FILE)

    await processing.start()

    expect(mockSendEvent.mock.calls[0][0].name).toBe('responses-processing-quarantine-error')
  })

  test('calls PublishEvent.sendEvent with event.properties.status "error" when an invalid file is given', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock_0001_Ack.xml`)
    await blockBlobClient.uploadFile(TEST_INVALID_FILE)

    await processing.start()

    expect(mockSendEvent.mock.calls[0][0].properties.status).toBe('error')
  })
})
