jest.mock('../../../app/storage')
const blobStorage = require('../../../app/storage')

jest.mock('../../../app/event/send-responses-quarantine-event')
const { sendResponsesQuarantineEvent } = require('../../../app/event/send-responses-quarantine-event')

const { quarantineFile } = require('../../../app/processing/quarantine-file')

const filename = require('../../mocks/filenames').TEST
const error = require('../../mocks/error')

describe('quarantine file', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  const inputs = [
    ['filename', filename],
    ['empty string', ''],
    ['object', {}],
    ['array', []],
    ['undefined', undefined],
    ['null', null]
  ]

  test.each(inputs)('should call blobStorage.quarantineFile with %s', async (_, input) => {
    await quarantineFile(input, error)
    expect(blobStorage.quarantineFile).toHaveBeenCalledTimes(1)
    expect(blobStorage.quarantineFile).toHaveBeenCalledWith(input)
  })

  test.each(inputs)('should call sendResponsesQuarantineEvent with %s', async (_, input) => {
    await quarantineFile(input, error)
    expect(sendResponsesQuarantineEvent).toHaveBeenCalledTimes(1)
    expect(sendResponsesQuarantineEvent).toHaveBeenCalledWith(input, error)
  })

  test('should return true when blobStorage.quarantineFile returns true', async () => {
    blobStorage.quarantineFile.mockReturnValue(true)
    const result = await quarantineFile(filename, error)
    expect(result).toBe(true)
  })

  test('should return false when blobStorage.quarantineFile returns false', async () => {
    blobStorage.quarantineFile.mockReturnValue(false)
    const result = await quarantineFile(filename, error)
    expect(result).toBe(false)
  })
})
