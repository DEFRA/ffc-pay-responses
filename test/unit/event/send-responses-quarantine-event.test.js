const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => {
  return {
    publishEvent: mockPublishEvent
  }
})

jest.mock('ffc-pay-event-publisher', () => {
  return {
    EventPublisher: MockEventPublisher
  }
})

jest.mock('../../../app/config')
const config = require('../../../app/config')

const { RESPONSE_REJECTED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')

const { sendResponsesQuarantineEvent } = require('../../../app/event/send-responses-quarantine-event')

const filename = require('../../mocks/filenames').TEST
const error = require('../../mocks/error')

describe('V2 quarantine ack event', () => {
  beforeEach(() => {
    config.eventsTopic = 'v2-events'
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should send event to V2 topic', async () => {
    await sendResponsesQuarantineEvent(filename, error)
    expect(MockEventPublisher.mock.calls[0][0]).toBe(config.eventsTopic)
  })

  test('should raise an event with processing source', async () => {
    await sendResponsesQuarantineEvent(filename, error)
    expect(mockPublishEvent.mock.calls[0][0].source).toBe(SOURCE)
  })

  test('should raise acknowledged payment event type', async () => {
    await sendResponsesQuarantineEvent(filename, error)
    expect(mockPublishEvent.mock.calls[0][0].type).toBe(RESPONSE_REJECTED)
  })

  test('should include error message in event data', async () => {
    await sendResponsesQuarantineEvent(filename, error)
    expect(mockPublishEvent.mock.calls[0][0].data.message).toBe(error.message)
  })
})
