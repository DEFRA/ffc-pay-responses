jest.mock('../../../app/config/mq-config', () => ({
  eventsTopic: 'test-topic'
}))

const mockPublish = jest.fn()
const mockEventPublisherClass = jest.fn().mockImplementation(() => ({
  publishEvent: mockPublish
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: mockEventPublisherClass
}))

const { sendResponsesFailureEvent } = require('../../../app/event/send-respones-failure-event')

describe('sendResponsesFailureEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('constructs EventPublisher with configured topic and publishes expected event', async () => {
    await sendResponsesFailureEvent('INV-123', 'failure-type', 'Something went wrong')

    expect(mockEventPublisherClass).toHaveBeenCalledWith('test-topic')
    expect(mockPublish).toHaveBeenCalledTimes(1)
    expect(mockPublish).toHaveBeenCalledWith({
      source: 'ffc-pay-responses',
      type: 'failure-type',
      subject: 'INV-123',
      data: {
        message: 'Something went wrong',
        invoiceNumber: 'INV-123'
      }
    })
  })
})
