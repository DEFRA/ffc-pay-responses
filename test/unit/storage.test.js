describe('BlobServiceClient initialization', () => {
  let consoleLogSpy
  let config
  let BlobServiceClient
  let DefaultAzureCredential

  beforeAll(() => {
    jest.doMock('@azure/storage-blob', () => {
      const getContainerClientMock = jest.fn()
      const fromConnectionStringMock = jest.fn().mockReturnValue({
        getContainerClient: getContainerClientMock
      })
      const BlobServiceClientMock = jest.fn().mockImplementation(() => ({
        getContainerClient: getContainerClientMock
      }))
      BlobServiceClientMock.fromConnectionString = fromConnectionStringMock
      return { BlobServiceClient: BlobServiceClientMock }
    })

    jest.doMock('@azure/identity', () => ({
      DefaultAzureCredential: jest.fn().mockImplementation((options) => ({
        type: 'DefaultAzureCredential',
        options
      }))
    }))
  })

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    config = require('../../app/config/storage-config')
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    ({ BlobServiceClient } = require('@azure/storage-blob'));
    ({ DefaultAzureCredential } = require('@azure/identity'))
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
    jest.clearAllMocks()
  })

  test('should use connection string when config.useConnectionStr is true', () => {
    config.useConnectionStr = true
    config.connectionStr = 'fake-connection-string'

    require('../../app/storage')

    expect(consoleLogSpy).toHaveBeenCalledWith('Using connection string for BlobServiceClient')
    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith(config.connectionStr)
  })

  test('should use DefaultAzureCredential when config.useConnectionStr is false', () => {
    config.useConnectionStr = false
    config.storageAccount = 'fakeaccount'
    config.managedIdentityClientId = 'fake-managed-id'

    require('../../app/storage')

    const expectedUri = `https://${config.storageAccount}.blob.core.windows.net`

    expect(consoleLogSpy).toHaveBeenCalledWith('Using DefaultAzureCredential for BlobServiceClient')
    expect(DefaultAzureCredential).toHaveBeenCalledWith({ managedIdentityClientId: config.managedIdentityClientId })
    expect(BlobServiceClient).toHaveBeenCalledWith(expectedUri,
      expect.objectContaining({
        type: 'DefaultAzureCredential',
        options: { managedIdentityClientId: config.managedIdentityClientId }
      })
    )
  })
})
