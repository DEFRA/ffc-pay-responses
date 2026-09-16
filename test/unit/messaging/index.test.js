const config = require('../../../app/config/mq-config')

const mockCreateServiceBusClient = jest.fn()
const mockCreateReceiver = jest.fn()
const mockSubscribeReceiver = jest.fn()
const mockCloseSenders = jest.fn()
const mockSendBatchMessages = jest.fn()
const mockGetSender = jest.fn()

jest.mock('../../../app/messaging/service-bus', () => ({
  createServiceBusClient: (...args) => mockCreateServiceBusClient(...args),
  createReceiver: (...args) => mockCreateReceiver(...args),
  subscribeReceiver: (...args) => mockSubscribeReceiver(...args),
  closeSenders: (...args) => mockCloseSenders(...args),
  sendBatchMessages: (...args) => mockSendBatchMessages(...args),
  getSender: (...args) => mockGetSender(...args)
}))

const { start, stop, sendAcknowledgementMessages, sendReturnMessages } = require('../../../app/messaging')

describe('messaging', () => {
  let mockClient
  let mockReceiver

  beforeEach(() => {
    jest.clearAllMocks()

    mockClient = { close: jest.fn().mockResolvedValue() }
    mockReceiver = {
      close: jest.fn().mockResolvedValue(),
      completeMessage: jest.fn().mockResolvedValue(),
      deadLetterMessage: jest.fn().mockResolvedValue()
    }

    mockCreateServiceBusClient.mockReturnValue(mockClient)
    mockCreateReceiver.mockReturnValue(mockReceiver)
    mockCloseSenders.mockResolvedValue()
    mockSendBatchMessages.mockResolvedValue()
    mockGetSender.mockReturnValue({ name: 'mock-sender' })
  })

  describe('start', () => {
    test('creates service bus client from submit subscription config', async () => {
      await start()

      expect(mockCreateServiceBusClient).toHaveBeenCalledWith(config.submitSubscription)
    })

    test('creates one receiver when numberOfReceivers is 1', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 1

      await start()

      expect(mockCreateReceiver).toHaveBeenCalledTimes(1)
      expect(mockCreateReceiver).toHaveBeenCalledWith(mockClient, config.submitSubscription)

      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })

    test('creates multiple receivers when numberOfReceivers is greater than 1', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 3

      await start()

      expect(mockCreateReceiver).toHaveBeenCalledTimes(3)
      expect(mockCreateReceiver).toHaveBeenCalledWith(mockClient, config.submitSubscription)

      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })

    test('subscribes each receiver with action, error handler and config', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 1

      await start()

      expect(mockSubscribeReceiver).toHaveBeenCalledTimes(1)
      expect(mockSubscribeReceiver).toHaveBeenCalledWith(
        mockReceiver,
        expect.any(Function),
        expect.any(Function),
        config.submitSubscription
      )

      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })

    test('wrapped action passes receiver to processSubmitMessage', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 1

      await start()

      const [, action] = mockSubscribeReceiver.mock.calls[0]
      const message = { body: { schemeId: 'SFI' } }
      await action(message)

      expect(mockReceiver.completeMessage).toHaveBeenCalledWith(message)

      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })

    test('error handler logs errors without throwing', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 1
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

      await start()

      const [, , errorHandler] = mockSubscribeReceiver.mock.calls[0]
      const error = new Error('process error')
      expect(() => errorHandler(error)).not.toThrow()
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error processing payment request message:', error)

      consoleErrorSpy.mockRestore()
      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })
  })

  describe('stop', () => {
    test('closes all receivers and the service bus client', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 2

      await start()
      await stop()

      expect(mockReceiver.close).toHaveBeenCalledTimes(2)
      expect(mockClient.close).toHaveBeenCalledTimes(1)
      expect(mockCloseSenders).toHaveBeenCalledTimes(1)

      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })

    test('continues closing receivers when one fails', async () => {
      const originalNumberOfReceivers = config.submitSubscription.numberOfReceivers
      config.submitSubscription.numberOfReceivers = 2
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      mockReceiver.close
        .mockRejectedValueOnce(new Error('close failed'))
        .mockResolvedValueOnce()

      await start()
      await stop()

      expect(mockReceiver.close).toHaveBeenCalledTimes(2)

      consoleErrorSpy.mockRestore()
      config.submitSubscription.numberOfReceivers = originalNumberOfReceivers
    })
  })

  describe('sendAcknowledgementMessages', () => {
    test('sends payload as acknowledgement messages', async () => {
      const payload = [{ id: 1 }]

      await sendAcknowledgementMessages(payload)

      expect(mockGetSender).toHaveBeenCalledWith(config.acknowledgementTopic)
      expect(mockSendBatchMessages).toHaveBeenCalledWith(expect.any(Object), expect.any(Array))
    })
  })

  describe('sendReturnMessages', () => {
    test('sends payload as return messages', async () => {
      const payload = [{ id: 1 }]

      await sendReturnMessages(payload)

      expect(mockGetSender).toHaveBeenCalledWith(config.returnTopic)
      expect(mockSendBatchMessages).toHaveBeenCalledWith(expect.any(Object), expect.any(Array))
    })
  })
})
