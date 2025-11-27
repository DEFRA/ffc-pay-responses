jest.mock('../../../../../app/processing/returns/sequence/get-sequence')
jest.mock('../../../../../app/processing/returns/sequence/increment-sequence')
jest.mock('../../../../../app/processing/returns/sequence/update-sequence')

const { getSequence } = require('../../../../../app/processing/returns/sequence/get-sequence')
const { incrementSequence } = require('../../../../../app/processing/returns/sequence/increment-sequence')
const { updateSequence } = require('../../../../../app/processing/returns/sequence/update-sequence')
const { getAndIncrementSequence } = require('../../../../../app/processing/returns/sequence/get-and-increment-sequence')

describe('getAndIncrementSequence', () => {
  const schemeId = 1
  const transaction = 'mock-transaction'
  const sequence = { nextReturn: 2 }

  beforeEach(() => {
    jest.clearAllMocks()
    getSequence.mockResolvedValue(sequence)
    incrementSequence.mockReturnValue(3)
  })

  test('should get, increment, update, and return sequence', async () => {
    const result = await getAndIncrementSequence(schemeId, transaction)

    expect(getSequence).toHaveBeenCalledWith(schemeId, transaction)
    expect(incrementSequence).toHaveBeenCalledWith(2)
    expect(updateSequence).toHaveBeenCalledWith(sequence, transaction)
    expect(result).toEqual({ sequence: 2, sequenceString: '0002' })
  })
})
