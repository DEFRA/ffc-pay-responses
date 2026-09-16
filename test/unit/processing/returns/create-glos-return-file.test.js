const moment = require('moment')
const { getSchemeIds } = require('ffc-pay-schemes')
const { createGlosReturnFile } = require('../../../../app/processing/returns/create-glos-return-file')
const { getAndIncrementSequence } = require('../../../../app/processing/returns/sequence/get-and-increment-sequence')
const { publishReturnFile } = require('../../../../app/processing/returns/publish-return-file')
const { getControlDate } = require('../../../helpers/get-control-date')
const { FC } = getSchemeIds()

jest.mock('../../../../app/processing/returns/sequence/get-and-increment-sequence')
jest.mock('../../../../app/processing/returns/publish-return-file')

describe('createGlosReturnFile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should generate correct filenames and content', async () => {
    const mockTransaction = {}
    const mockSequenceString = '00123'
    getAndIncrementSequence.mockResolvedValue({ sequenceString: mockSequenceString })

    const currentDate = moment()
    const expectedTimestamp = currentDate.format('YYMMDDHHmmss')
    const expectedReturnFilename = `FCAP_${mockSequenceString}_RPA_${expectedTimestamp}.dat`
    const expectedControlFilename = `FCAP_${mockSequenceString}_RPA_${expectedTimestamp}.dat.ctl`

    const content = [
      'Header',
      'Data1',
      'Data2',
      'Footer'
    ]
    const expectedReturnFileContent = [
      mockSequenceString,
      'Data1',
      'Data2',
      'Footer'
    ].join('\r\n')

    const controlCreationDate = getControlDate()
    const expectedControlFileContent = `<RPA.Finance.PipelineComponents.ControlFileDate><CreatedDate>${controlCreationDate}</CreatedDate></RPA.Finance.PipelineComponents.ControlFileDate>`

    await createGlosReturnFile(content, 'mockFilename', mockTransaction)

    expect(getAndIncrementSequence).toHaveBeenCalledWith(FC, mockTransaction)
    expect(publishReturnFile).toHaveBeenCalledWith(expectedReturnFilename, expectedReturnFileContent, expectedControlFilename, expectedControlFileContent)
  })

  test('should handle empty content', async () => {
    const mockTransaction = {}
    const mockSequenceString = '00123'
    getAndIncrementSequence.mockResolvedValue({ sequenceString: mockSequenceString })

    const currentDate = moment()
    const expectedTimestamp = currentDate.format('YYMMDDHHmmss')
    const expectedReturnFilename = `FCAP_${mockSequenceString}_RPA_${expectedTimestamp}.dat`
    const expectedControlFilename = `FCAP_${mockSequenceString}_RPA_${expectedTimestamp}.dat.ctl`
    const emptyContent = []

    const controlCreationDate = getControlDate()
    const expectedControlFileContent = `<RPA.Finance.PipelineComponents.ControlFileDate><CreatedDate>${controlCreationDate}</CreatedDate></RPA.Finance.PipelineComponents.ControlFileDate>`

    await createGlosReturnFile(emptyContent, 'mockFilename', mockTransaction)

    expect(getAndIncrementSequence).toHaveBeenCalledWith(FC, mockTransaction)
    expect(publishReturnFile).toHaveBeenCalledWith(expectedReturnFilename, mockSequenceString, expectedControlFilename, expectedControlFileContent)
  })
})
