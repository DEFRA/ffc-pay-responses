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
jest.useFakeTimers()
const processing = require('../../../app/processing')
const { BlobServiceClient } = require('@azure/storage-blob')
const config = require('../../../app/config')
const path = require('path')
let blobServiceClient
let container
const TEST_FILE = path.resolve(__dirname, '../../files/payment-file.csv')
const RETURN_TEST_FILE = path.resolve(__dirname, '../../files/return.csv')
const ACK_TEST_FILE = path.resolve(__dirname, '../../files/acknowledgement.xml')

describe('process payment files', () => {
  beforeAll(async () => {
    blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(config.storageConfig.container)
    await container.deleteIfExists()
    await container.createIfNotExists()
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/FFC mock Payment File.csv`)
    await blockBlobClient.uploadFile(TEST_FILE)
  })

  test('removes all payment files', async () => {
    await processing.start()

    const inboundFileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.inboundFolder })) {
      inboundFileList.push(item.name)
    }

    const archiveFileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.archiveFolder })) {
      archiveFileList.push(item.name)
    }

    expect(inboundFileList.filter(x => x === `${config.storageConfig.inboundFolder}/FFC mock Payment File.csv`).length).toBe(0)
    expect(archiveFileList.filter(x => x === `${config.storageConfig.archiveFolder}/FFC mock Payment File.csv`).length).toBe(0)
  })

  test('removes all payment files and return file is archived', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock Return File.csv`)
    await blockBlobClient.uploadFile(RETURN_TEST_FILE)
    await processing.start()

    const inboundFileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.inboundFolder })) {
      inboundFileList.push(item.name)
    }

    const archiveFileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.archiveFolder })) {
      archiveFileList.push(item.name)
    }

    expect(inboundFileList.filter(x => x === `${config.storageConfig.inboundFolder}/FFC mock Payment File.csv`).length).toBe(0)
    expect(archiveFileList.filter(x => x === `${config.storageConfig.archiveFolder}/FFC mock Payment File.csv`).length).toBe(0)
    expect(archiveFileList.filter(x => x === `${config.storageConfig.archiveFolder}/mock Return File.csv`).length).toBe(1)
  })

  test('removes all payment files and acknowledgement file is archived', async () => {
    const blockBlobClient = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/mock_0001_Ack.xml`)
    await blockBlobClient.uploadFile(ACK_TEST_FILE)
    await processing.start()

    const inboundFileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.inboundFolder })) {
      inboundFileList.push(item.name)
    }

    const archiveFileList = []
    for await (const item of container.listBlobsFlat({ prefix: config.storageConfig.archiveFolder })) {
      archiveFileList.push(item.name)
    }

    expect(inboundFileList.filter(x => x === `${config.storageConfig.inboundFolder}/FFC mock Payment File.csv`).length).toBe(0)
    expect(archiveFileList.filter(x => x === `${config.storageConfig.archiveFolder}/FFC mock Payment File.csv`).length).toBe(0)
    expect(archiveFileList.filter(x => x === `${config.storageConfig.archiveFolder}/mock_0001_Ack.xml`).length).toBe(1)
  })
})
