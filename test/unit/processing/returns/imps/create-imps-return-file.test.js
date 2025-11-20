const { IMPS } = require('../../../../../app/constants/schemes')
const config = require('../../../../../app/config')

jest.mock('../../../../../app/currency-convert', () => ({ convertToPounds: jest.fn() }))
jest.mock('../../../../../app/processing/returns/sequence/get-and-increment-sequence', () => ({ getAndIncrementSequence: jest.fn() }))
jest.mock('../../../../../app/processing/returns/publish-return-file', () => ({ publishReturnFile: jest.fn() }))
jest.mock('../../../../../app/processing/returns/imps/get-imps-acknowledgement-lines', () => ({ getImpsAcknowledgementLines: jest.fn() }))
jest.mock('../../../../../app/processing/returns/imps/get-imps-pending-returns', () => ({ getImpsPendingReturns: jest.fn() }))
jest.mock('../../../../../app/processing/returns/imps/get-imps-pending-return-lines', () => ({ getImpsPendingReturnLines: jest.fn() }))
jest.mock('../../../../../app/processing/returns/imps/get-imps-pending-acknowledgements', () => ({ getImpsPendingAcknowledgements: jest.fn() }))
jest.mock('../../../../../app/processing/returns/imps/all-imps-acknowledgements-received', () => ({ allImpsAcknowledgementsReceived: jest.fn() }))
jest.mock('../../../../../app/processing/returns/imps/set-imps-acknowledgements-exported', () => ({ setImpsAcknowledgementsExported: jest.fn() }))
jest.mock('../../../../../app/processing/returns/sequence/update-sequence', () => ({ updateSequence: jest.fn() }))

const { createImpsReturnFile } = require('../../../../../app/processing/returns/imps/create-imps-return-file')

const { convertToPounds } = require('../../../../../app/currency-convert')
const { getAndIncrementSequence } = require('../../../../../app/processing/returns/sequence/get-and-increment-sequence')
const { getImpsAcknowledgementLines } = require('../../../../../app/processing/returns/imps/get-imps-acknowledgement-lines')
const { getImpsPendingReturns } = require('../../../../../app/processing/returns/imps/get-imps-pending-returns')
const { getImpsPendingReturnLines } = require('../../../../../app/processing/returns/imps/get-imps-pending-return-lines')
const { allImpsAcknowledgementsReceived } = require('../../../../../app/processing/returns/imps/all-imps-acknowledgements-received')
const { getImpsPendingAcknowledgements } = require('../../../../../app/processing/returns/imps/get-imps-pending-acknowledgements')
const { setImpsAcknowledgementsExported } = require('../../../../../app/processing/returns/imps/set-imps-acknowledgements-exported')
const { updateSequence } = require('../../../../../app/processing/returns/sequence/update-sequence')
const { publishReturnFile } = require('../../../../../app/processing/returns/publish-return-file')

describe('createImpsReturnFile', () => {
  const acknowledgements = [
    { invoiceNumber: 'INV001', frn: 'FRN001', success: true },
    { invoiceNumber: 'INV002', frn: 'FRN002', success: true }
  ]
  const transaction = 'mock_transaction'
  const sequence = 1
  const sequenceString = '0001'
  const totalValue = 1000
  const acknowledgementLines = ['line1', 'line2']
  const pendingReturnLines = ['returnLine1', 'returnLine2']

  beforeEach(() => {
    jest.clearAllMocks()
    config.useV2ReturnFiles = true
    convertToPounds.mockReturnValue(totalValue)
    getAndIncrementSequence.mockResolvedValue({ sequence, sequenceString })
    getImpsAcknowledgementLines.mockResolvedValue({ acknowledgementLines, batchNumbers: [] })
    getImpsPendingReturns.mockResolvedValue([])
    getImpsPendingReturnLines.mockResolvedValue({ pendingReturnLines, totalValue })
    allImpsAcknowledgementsReceived.mockResolvedValue(true)
    getImpsPendingAcknowledgements.mockResolvedValue(acknowledgements)
  })

  test('creates return file with proper content', async () => {
    await createImpsReturnFile(acknowledgements, transaction)
    const totalLines = acknowledgementLines.length + pendingReturnLines.length
    const expectedHeader = `B,04,${sequenceString},${totalLines},${convertToPounds(totalValue)},S`
    const expectedContent = `${expectedHeader}\r\n${acknowledgementLines.join('\r\n')}\r\n${pendingReturnLines.join('\r\n')}`

    expect(getAndIncrementSequence).toHaveBeenCalledWith(IMPS, transaction)
    expect(getImpsAcknowledgementLines).toHaveBeenCalledWith(acknowledgements, sequence, transaction)
    expect(publishReturnFile).toHaveBeenCalledWith(
    `RET_IMPS_AP_${sequenceString}.INT`,
    expectedContent,
    `CTL_RET_IMPS_AP_${sequenceString}.INT`,
    null
    )
  })

  test.each([
    ['not all acknowledgements received', false, true],
    ['all acknowledgements received', true, false]
  ])('%s', async (_, allReceived, shouldPublish) => {
    allImpsAcknowledgementsReceived.mockResolvedValue(allReceived)
    await createImpsReturnFile(acknowledgements, transaction)

    if (!allReceived) {
      expect(updateSequence).toHaveBeenCalledWith({ schemeId: IMPS, nextReturn: sequence }, transaction)
      expect(publishReturnFile).not.toHaveBeenCalled()
    } else {
      expect(setImpsAcknowledgementsExported).toHaveBeenCalledTimes(config.useV2ReturnFiles ? 1 : 0)
      expect(getImpsPendingAcknowledgements).toHaveBeenCalledWith(sequence, transaction)
    }
  })

  test('does not call setImpsAcknowledgementsExported if useV2ReturnFiles is false', async () => {
    config.useV2ReturnFiles = false
    await createImpsReturnFile(acknowledgements, transaction)
    expect(setImpsAcknowledgementsExported).not.toHaveBeenCalled()
  })
})
