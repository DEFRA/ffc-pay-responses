const { sendBatchMessage } = require('../../../app/messaging/send-batch-message')
const { SOURCE } = require('../../../app/constants/source')

const mockSender = { name: 'mock-sender' }
const mockGetSender = jest.fn()
const mockSendBatchMessages = jest.fn()

jest.mock('../../../app/messaging/service-bus', () => ({
  getSender: (...args) => mockGetSender(...args),
  sendBatchMessages: (...args) => mockSendBatchMessages(...args)
}))

describe('sendBatchMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetSender.mockReturnValue(mockSender)
    mockSendBatchMessages.mockResolvedValue()
  })

  test('gets sender for provided options', async () => {
    const options = { address: 'topic-address' }
    await sendBatchMessage([], 'type', options)

    expect(mockGetSender).toHaveBeenCalledWith(options)
  })

  test('creates a message for each body item', async () => {
    const body = [{ id: 1 }, { id: 2 }]
    const type = 'uk.gov.demo.claim.validated'

    await sendBatchMessage(body, type, {})

    expect(mockSendBatchMessages).toHaveBeenCalledWith(mockSender, [
      { body: { id: 1 }, type, source: SOURCE },
      { body: { id: 2 }, type, source: SOURCE }
    ])
  })

  test('sends empty array when body is empty', async () => {
    await sendBatchMessage([], 'type', {})

    expect(mockSendBatchMessages).toHaveBeenCalledWith(mockSender, [])
  })

  test('throws when sendBatchMessages fails', async () => {
    const error = new Error('send failed')
    mockSendBatchMessages.mockRejectedValue(error)

    await expect(sendBatchMessage([{ id: 1 }], 'type', {})).rejects.toThrow(error)
  })
})
