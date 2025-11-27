const config = require('../../app/config')

jest.mock('../../app/messaging')
const { start: mockStartMessaging } = require('../../app/messaging')
jest.mock('../../app/processing')
const { start: mockStartProcessing } = require('../../app/processing')
jest.mock('../../app/server')
const { start: mockStartServer } = require('../../app/server')

const startApp = require('../../app')

describe('app start', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test.each([
    [true, 1, 1, 1],
    [false, 0, 0, 1]
  ])(
    'with processingActive=%s, starts processing=%i, messaging=%i, server=%i',
    async (active, processingCalls, messagingCalls, serverCalls) => {
      config.processingActive = active
      await startApp()
      expect(mockStartProcessing).toHaveBeenCalledTimes(processingCalls)
      expect(mockStartMessaging).toHaveBeenCalledTimes(messagingCalls)
      expect(mockStartServer).toHaveBeenCalledTimes(serverCalls)
    }
  )

  test('logs console.info correctly when processing inactive', async () => {
    config.processingActive = false
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await startApp()
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining('Processing capabilities are currently not enabled in this environment')
    )
    spy.mockRestore()
  })

  test('does not log console.info when processing active', async () => {
    config.processingActive = true
    const spy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await startApp()
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })
})
