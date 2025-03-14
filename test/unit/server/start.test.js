jest.mock('../../../app/server/create-server')
const { createServer: mockCreateServer } = require('../../../app/server/create-server')

const mockServer = {
  start: jest.fn()
}

const { start } = require('../../../app/server/start')

describe('start server', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockCreateServer.mockResolvedValue(mockServer)
  })

  test('should create new server instance', async () => {
    await start()
    expect(mockCreateServer).toHaveBeenCalledTimes(1)
  })

  test('should start server', async () => {
    await start()
    expect(mockServer.start).toHaveBeenCalledTimes(1)
  })
})
