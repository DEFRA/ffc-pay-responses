const mockPublishEvent = jest.fn()

const MockEventPublisher = jest.fn().mockImplementation(() => ({
  publishEvent: mockPublishEvent
}))

jest.mock('ffc-pay-event-publisher', () => ({
  EventPublisher: MockEventPublisher
}))

jest.mock('../../../app/config')
const config = require('../../../app/config')

const { RESPONSE_REJECTED } = require('../../../app/constants/events')
const { SOURCE } = require('../../../app/constants/source')
const { sendResponsesQuarantineEvent } = require('../../../app/event/send-responses-quarantine-event')
const filename = require('../../mocks/filenames').TEST
const error = require('../../mocks/error')

describe('V2 quarantine ack event', () => {
  let event

  beforeEach(async () => {
    config.eventsTopic = 'v2-events'
    jest.clearAllMocks()
    await sendResponsesQuarantineEvent(filename, error)
    event = mockPublishEvent.mock.calls[0][0]
  })

  test('sends event to the correct V2 topic', () => {
    expect(MockEventPublisher).toHaveBeenCalledWith(config.eventsTopic)
  })

  test('raises event with processing source', () => {
    expect(event.source).toBe(SOURCE)
  })

  test('raises acknowledged payment event type', () => {
    expect(event.type).toBe(RESPONSE_REJECTED)
  })

  test('includes error message in event data', () => {
    expect(event.data.message).toBe(error.message)
  })
})
