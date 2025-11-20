jest.useFakeTimers()

const mockSendBatchMessages = jest.fn()
const mockPublishEvent = jest.fn()

jest.mock('ffc-messaging', () => ({
  MessageBatchSender: jest.fn().mockImplementation(() => ({
    sendBatchMessages: mockSendBatchMessages,
    closeConnection: jest.fn()
  }))
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: jest.fn().mockImplementation(() => ({
    publishEvent: mockPublishEvent
  }))
}))

const path = require('path')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config')
const db = require('../../../app/data')
const processing = require('../../../app/processing')
const { RESPONSE_REJECTED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const TEST_FILE = path.resolve(__dirname, '../../files/Return File.csv')
const TEST_INVALID_FILE = path.resolve(__dirname, '../../files/broken-return.csv')

const VALID_FILENAME = 'mock Return File.csv'
const INVALID_FILENAME = 'ignore me.csv'

const IMPS_FILENAME = 'RET_IMPS.INT'
const IMPS_TEST_FILE = path.resolve(__dirname, '../../files/imps-return-file.INT')

const GENESIS_FILENAME = 'GENESISPayConf.gni'
const GENESIS_TEST_FILE = path.resolve(__dirname, '../../files/genesis-return-file.gni')

const GLOS_FILENAME = 'FCAP RPA.dat'
const GLOS_TEST_FILE = path.resolve(__dirname, '../../files/glos-return-file.dat')

let blobServiceClient
let container

const uploadFile = async (filename, filePath) => {
  const blob = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${filename}`)
  await blob.uploadFile(filePath)
}

const listBlobs = async (prefix = '') => {
  const items = []
  for await (const blob of container.listBlobsFlat({ prefix })) {
    items.push(blob.name)
  }
  return items
}

const assertArchived = async (filename) => {
  const archived = await listBlobs(config.storageConfig.archiveFolder)
  expect(archived).toContain(`${config.storageConfig.archiveFolder}/${filename}`)
}

const assertQuarantined = async (filename) => {
  const quarantined = await listBlobs(config.storageConfig.quarantineFolder)
  expect(quarantined).toContain(`${config.storageConfig.quarantineFolder}/${filename}`)
}

describe('process return', () => {
  beforeEach(async () => {
    jest.clearAllMocks()
    mockSendBatchMessages.mockReset()
    await db.impsReturn.destroy({ truncate: true })
    blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(config.storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    await uploadFile(VALID_FILENAME, TEST_FILE)
  })

  test('sends all returns and correct invoice/settled info', async () => {
    await processing.start()
    const calls = mockSendBatchMessages.mock.calls[0][0]
    expect(calls.length).toBe(6)
    expect(calls[0].body.invoiceNumber).toBe('S123456789A123456V001')
    expect(calls[0].body.settled).toBe(true)
    expect(calls[4].body.settled).toBe(true)
    expect(calls[5].body.settled).toBe(false)
    expect(calls[0].body.filename).toBe(VALID_FILENAME)
  })

  test('archives valid file on success', async () => {
    await processing.start()
    await assertArchived(VALID_FILENAME)
  })

  test('does not quarantine if unable to publish message', async () => {
    mockSendBatchMessages.mockImplementation(() => { throw new Error('Unable to publish message') })
    await processing.start()
    const inbound = await listBlobs(config.storageConfig.inboundFolder)
    expect(inbound).toContain(`${config.storageConfig.inboundFolder}/${VALID_FILENAME}`)
  })

  test('ignores unrelated file', async () => {
    await uploadFile(INVALID_FILENAME, TEST_FILE)
    await processing.start()
    const inbound = await listBlobs(config.storageConfig.inboundFolder)
    expect(inbound).toContain(`${config.storageConfig.inboundFolder}/${INVALID_FILENAME}`)
  })

  test('quarantines invalid file', async () => {
    await uploadFile(VALID_FILENAME, TEST_INVALID_FILE)
    await processing.start()
    await assertQuarantined(VALID_FILENAME)
  })

  test('publishes RESPONSE_REJECTED event for invalid file', async () => {
    await uploadFile(VALID_FILENAME, TEST_INVALID_FILE)
    await processing.start()
    expect(mockPublishEvent).toHaveBeenCalledTimes(1)
    const event = mockPublishEvent.mock.calls[0][0]
    expect(event.type).toBe(RESPONSE_REJECTED)
    expect(event.source).toBe(SOURCE)
    expect(event.subject).toBe(VALID_FILENAME)
  })

  test.each([
    [GENESIS_FILENAME, GENESIS_TEST_FILE, 'GENESISPayConf', '.gni'],
    [GENESIS_FILENAME, GENESIS_TEST_FILE, 'GENESISPayConf', '.gni.ctl'],
    [GLOS_FILENAME, GLOS_TEST_FILE, 'FCAP_', '.dat'],
    [GLOS_FILENAME, GLOS_TEST_FILE, 'FCAP_', '.ctl']
  ])('creates %s return files correctly', async (filename, filePath, prefix, suffix) => {
    await uploadFile(filename, filePath)
    await processing.start()
    const returns = await listBlobs(config.storageConfig.returnFolder)
    expect(returns.some(x => x.startsWith(`${config.storageConfig.returnFolder}/${prefix}`) && x.endsWith(suffix))).toBe(true)
  })

  test('does not create IMPS return file but saves IMPS return data', async () => {
    await uploadFile(IMPS_FILENAME, IMPS_TEST_FILE)
    await processing.start()
    const returns = await listBlobs(config.storageConfig.returnFolder)
    expect(returns.filter(x => x.startsWith(`${config.storageConfig.returnFolder}/RET_IMPS`))).toHaveLength(0)

    const impsReturns = await db.impsReturn.findAll()
    expect(impsReturns.length).toBe(2)
  })
})
