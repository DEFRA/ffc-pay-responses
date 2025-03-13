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

  test('starts processing when active is true', async () => {
    config.processingActive = true
    await startApp()
    expect(mockStartProcessing).toHaveBeenCalledTimes(1)
  })

  test('does not start processing if active is false', async () => {
    config.processingActive = false
    await startApp()
    expect(mockStartProcessing).toHaveBeenCalledTimes(0)
  })

  test('starts messaging when active is true', async () => {
    config.processingActive = true
    await startApp()
    expect(mockStartMessaging).toHaveBeenCalledTimes(1)
  })

  test('does not start messaging when active is false', async () => {
    config.processingActive = false
    await startApp()
    expect(mockStartMessaging).toHaveBeenCalledTimes(0)
  })

  test('starts server when active is true', async () => {
    config.active = true
    await startApp()
    expect(mockStartServer).toHaveBeenCalledTimes(1)
  })

  test('starts server when active is false', async () => {
    config.active = false
    await startApp()
    expect(mockStartServer).toHaveBeenCalledTimes(1)
  })

  test('does not log console.info when active is true', async () => {
    config.processingActive = true
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await startApp()
    expect(consoleInfoSpy).not.toHaveBeenCalled()
    consoleInfoSpy.mockRestore()
  })

  test('logs console.info when active is false', async () => {
    config.processingActive = false
    const consoleInfoSpy = jest.spyOn(console, 'info').mockImplementation(() => {})
    await startApp()
    expect(consoleInfoSpy).toHaveBeenCalledWith(
      expect.stringContaining('Processing capabilities are currently not enabled in this environment')
    )
    consoleInfoSpy.mockRestore()
  })
})
