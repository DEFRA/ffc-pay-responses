const { processSubmitMessage } = require('../../../app/messaging/process-submit-message')
const { saveImpsSubmission } = require('../../../app/messaging/save-imps-submission')
const { IMPS } = require('../../../app/constants/schemes')

jest.mock('../../../app/messaging/save-imps-submission')

describe('processSubmitMessage', () => {
  let receiver
  let message
  let consoleLogSpy

  beforeEach(() => {
    receiver = { completeMessage: jest.fn(), deadLetterMessage: jest.fn() }
    message = { body: { schemeId: IMPS, someData: 'test' } }
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.clearAllMocks()
    consoleLogSpy.mockRestore()
  })

  test('processes IMPS message, saves submission, and completes message', async () => {
    await processSubmitMessage(message, receiver)
    expect(saveImpsSubmission).toHaveBeenCalledWith(message.body)
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
    expect(consoleLogSpy).toHaveBeenCalled()
  })

  test('completes non-IMPS message without saving', async () => {
    message.body.schemeId = 'OTHER'
    await processSubmitMessage(message, receiver)
    expect(saveImpsSubmission).not.toHaveBeenCalled()
    expect(receiver.completeMessage).toHaveBeenCalledWith(message)
  })

  test('logs error if saveImpsSubmission fails without throwing', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    saveImpsSubmission.mockRejectedValue(new Error('Test error'))

    await processSubmitMessage(message, receiver)
    expect(consoleErrorSpy).toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
  })
})
