jest.useFakeTimers()
jest.mock('ffc-pay-event-publisher')

const mockSendBatchMessages = jest.fn()
jest.mock('ffc-messaging', () => ({
  MessageBatchSender: jest.fn().mockImplementation(() => ({
    sendBatchMessages: mockSendBatchMessages,
    closeConnection: jest.fn()
  }))
}))

const path = require('path')
const { BlobServiceClient } = require('@azure/storage-blob')
const processing = require('../../../app/processing')
const config = require('../../../app/config')

const TEST_FILE = path.resolve(__dirname, '../../files/payment-file.csv')
const RETURN_FILE = path.resolve(__dirname, '../../files/Return File.csv')
const ACK_FILE = path.resolve(__dirname, '../../files/acknowledgement.xml')

const returnFiles = ['mock Return File1.csv', 'mock Return File2.csv']
const paymentFiles = ['FFC mock Payment File2.csv', 'FFC mock Payment File3.csv']
const ackFiles = ['mock_0001_Ack.xml', 'mock_0002_Ack.xml']

let container

const uploadFiles = async (files, filePath) => {
  for (const file of files) {
    const blob = container.getBlockBlobClient(`${config.storageConfig.inboundFolder}/${file}`)
    await blob.uploadFile(filePath)
  }
}

const listBlobs = async (prefix = '') => {
  const items = []
  for await (const blob of container.listBlobsFlat({ prefix })) {
    items.push(blob.name)
  }
  return items
}

describe('process payment files', () => {
  beforeAll(async () => {
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.storageConfig.connectionStr)
    container = blobServiceClient.getContainerClient(config.storageConfig.container)
  })

  beforeEach(async () => {
    await container.deleteIfExists()
    await container.createIfNotExists()
  })

  const assertArchived = async (files) => {
    const archived = await listBlobs(config.storageConfig.archiveFolder)
    for (const file of files) {
      expect(archived).toContain(`${config.storageConfig.archiveFolder}/${file}`)
    }
  }

  const assertRemovedFromInbound = async (files) => {
    const inbound = await listBlobs(config.storageConfig.inboundFolder)
    for (const file of files) {
      expect(inbound).not.toContain(`${config.storageConfig.inboundFolder}/${file}`)
    }
  }

  test.each([
    [returnFiles, RETURN_FILE, 'archive return files when no payment files'],
    [ackFiles, ACK_FILE, 'archive acknowledgement files when no payment files']
  ])('Should %s', async (files, filePath, _) => {
    await uploadFiles(files, filePath)
    await processing.start()
    await assertArchived(files)
  })

  test.each([
    [paymentFiles, 'single payment file removal', TEST_FILE],
    [paymentFiles, 'multiple payment file removal', TEST_FILE]
  ])('Should remove all payment files when %s', async (_, description, filePath) => {
    await uploadFiles(paymentFiles, filePath)
    await processing.start()
    await assertRemovedFromInbound(paymentFiles)
    const archived = await listBlobs(config.storageConfig.archiveFolder)
    for (const file of paymentFiles) {
      expect(archived).not.toContain(`${config.storageConfig.archiveFolder}/${file}`)
    }
  })

  test.each([
    [[...paymentFiles, ...returnFiles], RETURN_FILE, 'archive return files with payment files'],
    [[...paymentFiles, ...ackFiles], ACK_FILE, 'archive ack files with payment files'],
    [[...paymentFiles, ...returnFiles, ...ackFiles], RETURN_FILE, 'archive return files with payment and ack files'],
    [[...paymentFiles, ...returnFiles, ...ackFiles], ACK_FILE, 'archive ack files with payment and return files']
  ])('Should properly archive %s', async (files, filePath, _) => {
    await uploadFiles(files, filePath)
    await processing.start()

    const filesToCheck = filePath === RETURN_FILE ? returnFiles : ackFiles
    await assertArchived(filesToCheck)
    await assertRemovedFromInbound(paymentFiles)
  })
})
