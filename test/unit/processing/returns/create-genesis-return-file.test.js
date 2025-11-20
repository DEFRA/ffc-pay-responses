const moment = require('moment')
const { createGenesisReturnFile } = require('../../../../app/processing/returns/create-genesis-return-file')
const { publishReturnFile } = require('../../../../app/processing/returns/publish-return-file')
const { getAndIncrementSequence } = require('../../../../app/processing/returns/sequence/get-and-increment-sequence')
const { ES } = require('../../../../app/constants/schemes')

jest.mock('../../../../app/processing/returns/sequence/get-and-increment-sequence')
jest.mock('../../../../app/processing/returns/publish-return-file')

describe('createGenesisReturnFile', () => {
  const mockTransaction = {}

  beforeEach(() => jest.clearAllMocks())

  const getFilenames = (sequence) => {
    const date = moment()
    const dateStr = date.format('YYYYMMDD')
    return [
      `GENESISPayConf_${dateStr}_${sequence}.gni`,
      `GENESISPayConf_${dateStr}_${sequence}.gni.ctl`
    ]
  }

  test.each([
    [['H^header1^header2^header3', 'D^detail1^detail2^detail3', 'T^trailer1^trailer2^trailer3'], true],
    [[], false]])('should publish return file correctly (hasContent=%s)', async (content, hasContent) => {
    const sequence = '00123'
    getAndIncrementSequence.mockResolvedValue({ sequenceString: sequence })

    const [expectedReturnFilename, expectedControlFilename] = getFilenames(sequence)
    const currentDate = moment()

    const expectedReturnFileContent = hasContent
      ? [
          `H^${currentDate.format('DD/MM/YYYY')}^header2^header3^${sequence}`,
          'D^detail1^detail2^detail3',
          `T^${currentDate.format('DD/MM/YYYY')}^${currentDate.format('HH:mm:ss')}`
        ].join('\r\n')
      : ''

    await createGenesisReturnFile(content, 'mockFilename', mockTransaction)

    expect(getAndIncrementSequence).toHaveBeenCalledWith(ES, mockTransaction)
    expect(publishReturnFile).toHaveBeenCalledWith(expectedReturnFilename, expectedReturnFileContent, expectedControlFilename, null)
  })
})
