jest.mock('uuid')
const { v4: uuidv4 } = require('uuid')

jest.mock('../../../app/event/raise-event')
const raiseEvent = require('../../../app/event/raise-event')

const sendResponsesQuarantineEvent = require('../../../app/event/send-responses-quarantine-event')

let filename
let event

describe('Sending event for quarantined DAX response file', () => {
  beforeEach(async () => {
    uuidv4.mockImplementation(() => { '70cb0f07-e0cf-449c-86e8-0344f2c6cc6c' })

    filename = 'acknowledgement.xml'

    event = {
      name: 'responses-processing-quarantine-error',
      type: 'error',
      message: `Quarantined ${filename}`,
      data: {
        filename
      }
    }
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call uuidv4 when a filename is received', async () => {
    await sendResponsesQuarantineEvent(filename)
    expect(uuidv4).toHaveBeenCalled()
  })

  test('should call uuidv4 once when a filename is received', async () => {
    await sendResponsesQuarantineEvent(filename)
    expect(uuidv4).toHaveBeenCalledTimes(1)
  })

  test('should call uuidv4 when an empty string is received', async () => {
    await sendResponsesQuarantineEvent('')
    expect(uuidv4).toHaveBeenCalled()
  })

  test('should call uuidv4 once when an empty string is received', async () => {
    await sendResponsesQuarantineEvent('')
    expect(uuidv4).toHaveBeenCalledTimes(1)
  })

  test('should call uuidv4 when an object is received', async () => {
    await sendResponsesQuarantineEvent({})
    expect(uuidv4).toHaveBeenCalled()
  })

  test('should call uuidv4 once when an object is received', async () => {
    await sendResponsesQuarantineEvent({})
    expect(uuidv4).toHaveBeenCalledTimes(1)
  })

  test('should call uuidv4 when an array is received', async () => {
    await sendResponsesQuarantineEvent([])
    expect(uuidv4).toHaveBeenCalled()
  })

  test('should call uuidv4 once when an array is received', async () => {
    await sendResponsesQuarantineEvent([])
    expect(uuidv4).toHaveBeenCalledTimes(1)
  })

  test('should call uuidv4 when undefined is received', async () => {
    await sendResponsesQuarantineEvent(undefined)
    expect(uuidv4).toHaveBeenCalled()
  })

  test('should call uuidv4 once when undefined is received', async () => {
    await sendResponsesQuarantineEvent(undefined)
    expect(uuidv4).toHaveBeenCalledTimes(1)
  })

  test('should call uuidv4 when null is received', async () => {
    await sendResponsesQuarantineEvent(null)
    expect(uuidv4).toHaveBeenCalled()
  })

  test('should call uuidv4 once when null is received', async () => {
    await sendResponsesQuarantineEvent(null)
    expect(uuidv4).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent when a filename is received', async () => {
    await sendResponsesQuarantineEvent(filename)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent once when a filename is received', async () => {
    await sendResponsesQuarantineEvent(filename)
    expect(raiseEvent).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent with event and "error" when a filename is received', async () => {
    event = {
      ...event,
      id: uuidv4()
    }

    await sendResponsesQuarantineEvent(filename)

    expect(raiseEvent).toHaveBeenCalledWith(event, 'error')
  })

  test('should call raiseEvent when an empty string is received', async () => {
    await sendResponsesQuarantineEvent('')
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent once when an empty string is received', async () => {
    await sendResponsesQuarantineEvent('')
    expect(raiseEvent).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent with event and "error" when an empty string is received', async () => {
    filename = ''
    event = {
      ...event,
      id: uuidv4(),
      message: `Quarantined ${filename}`,
      data: {
        filename
      }
    }

    await sendResponsesQuarantineEvent(filename)

    expect(raiseEvent).toHaveBeenCalledWith(event, 'error')
  })

  test('should call raiseEvent when an object is received', async () => {
    await sendResponsesQuarantineEvent({})
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent once when an object is received', async () => {
    await sendResponsesQuarantineEvent({})
    expect(raiseEvent).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent with event and "error" when an object is received', async () => {
    filename = {}
    event = {
      ...event,
      id: uuidv4(),
      message: `Quarantined ${filename}`,
      data: {
        filename
      }
    }

    await sendResponsesQuarantineEvent(filename)

    expect(raiseEvent).toHaveBeenCalledWith(event, 'error')
  })

  test('should call raiseEvent when an array is received', async () => {
    await sendResponsesQuarantineEvent([])
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent once when an array is received', async () => {
    await sendResponsesQuarantineEvent([])
    expect(raiseEvent).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent with event and "error" when an array is received', async () => {
    filename = []
    event = {
      ...event,
      id: uuidv4(),
      message: `Quarantined ${filename}`,
      data: {
        filename
      }
    }

    await sendResponsesQuarantineEvent(filename)

    expect(raiseEvent).toHaveBeenCalledWith(event, 'error')
  })

  test('should call raiseEvent when undefined is received', async () => {
    await sendResponsesQuarantineEvent(undefined)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent once when undefined is received', async () => {
    await sendResponsesQuarantineEvent(undefined)
    expect(raiseEvent).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent with event and "error" when undefined is received', async () => {
    filename = undefined
    event = {
      ...event,
      id: uuidv4(),
      message: `Quarantined ${filename}`,
      data: {
        filename
      }
    }

    await sendResponsesQuarantineEvent(filename)

    expect(raiseEvent).toHaveBeenCalledWith(event, 'error')
  })

  test('should call raiseEvent when null is received', async () => {
    await sendResponsesQuarantineEvent(null)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent once when null is received', async () => {
    await sendResponsesQuarantineEvent(null)
    expect(raiseEvent).toHaveBeenCalledTimes(1)
  })

  test('should call raiseEvent with event and "error" when null is received', async () => {
    filename = null
    event = {
      ...event,
      id: uuidv4(),
      message: `Quarantined ${filename}`,
      data: {
        filename
      }
    }

    await sendResponsesQuarantineEvent(filename)

    expect(raiseEvent).toHaveBeenCalledWith(event, 'error')
  })
})
