const { IMPS } = require('../../../../../app/constants/schemes')
const { convertToPounds } = require('../../../../../app/currency-convert')
const { getImpsAcknowledgementLines } = require('../../../../../app/processing/returns/imps/get-imps-acknowledgement-lines')
const { getImpsPendingReturns } = require('../../../../../app/processing/returns/imps/get-imps-pending-returns')
const { getImpsPendingReturnLines } = require('../../../../../app/processing/returns/imps/get-imps-pending-return-lines')
const { getImpsPendingAcknowledgements } = require('../../../../../app/processing/returns/imps/get-imps-pending-acknowledgements')
const { allImpsAcknowledgementsReceived } = require('../../../../../app/processing/returns/imps/all-imps-acknowledgements-received')
const { setImpsAcknowledgementsExported } = require('../../../../../app/processing/returns/imps/set-imps-acknowledgements-exported')
const { publishReturnFile } = require('../../../../../app/processing/returns/publish-return-file')
const { getAndIncrementSequence } = require('../../../../../app/processing/returns/sequence/get-and-increment-sequence')
const { updateSequence } = require('../../../../../app/processing/returns/sequence/update-sequence')
const config = require('../../../../../app/config')

jest.mock('../../../../../app/currency-convert', () => ({
  convertToPounds: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/sequence/get-and-increment-sequence', () => ({
  getAndIncrementSequence: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/publish-return-file', () => ({
  publishReturnFile: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/imps/get-imps-acknowledgement-lines', () => ({
  getImpsAcknowledgementLines: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/imps/get-imps-pending-returns', () => ({
  getImpsPendingReturns: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/imps/get-imps-pending-return-lines', () => ({
  getImpsPendingReturnLines: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/imps/get-imps-pending-acknowledgements', () => ({
  getImpsPendingAcknowledgements: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/imps/all-imps-acknowledgements-received', () => ({
  allImpsAcknowledgementsReceived: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/imps/set-imps-acknowledgements-exported', () => ({
  setImpsAcknowledgementsExported: jest.fn()
}))

jest.mock('../../../../../app/processing/returns/sequence/update-sequence', () => ({
  updateSequence: jest.fn()
}))

const {
  createImpsReturnFile
} = require('../../../../../app/processing/returns/imps/create-imps-return-file')

describe('createImpsReturnFile', () => {
  const acknowledgements = [{ invoiceNumber: 'INV001', frn: 'FRN001', success: true }, { invoiceNumber: 'INV002', frn: 'FRN002', success: true }]
  const filename = 'mock_filename'
  const transaction = 'mock_transaction'
  const sequence = 1
  const sequenceString = '0001'
  const totalValue = 1000
  const acknowledgementLines = ['line1', 'line2']
  const pendingReturnLines = ['returnLine1', 'returnLine2']

  beforeEach(() => {
    jest.clearAllMocks()
    config.useV2ReturnFiles = true
    convertToPounds.mockReturnValue(1000)
    getAndIncrementSequence.mockResolvedValue({ sequence, sequenceString })
    getImpsAcknowledgementLines.mockResolvedValue({ acknowledgementLines, batchNumbers: [] })
    getImpsPendingReturns.mockResolvedValue([])
    getImpsPendingReturnLines.mockResolvedValue({ pendingReturnLines, totalValue })
    allImpsAcknowledgementsReceived.mockResolvedValue(true)
    getImpsPendingAcknowledgements.mockResolvedValue(acknowledgements)
  })

  test('should create return file with proper content', async () => {
    await createImpsReturnFile(acknowledgements, filename, transaction)
    expect(getAndIncrementSequence).toHaveBeenCalledWith(IMPS, transaction)
    expect(getImpsAcknowledgementLines).toHaveBeenCalledWith(acknowledgements, sequence, transaction)
    expect(getImpsPendingReturns).toHaveBeenCalledWith(transaction)
    expect(getImpsPendingReturnLines).toHaveBeenCalledWith([], [], transaction)
    const expectedHeader = `B,04,${sequenceString},${4},${convertToPounds(totalValue)},S`
    const expectedContent = `${expectedHeader}\r\nline1\r\nline2\r\nreturnLine1\r\nreturnLine2`

    expect(publishReturnFile).toHaveBeenCalledWith(`RET_IMPS_AP_${sequenceString}.INT`, expectedContent, `CTL_RET_IMPS_AP_${sequenceString}.INT`, null)
  })

  test('should return early if not all acknowledgements are received', async () => {
    allImpsAcknowledgementsReceived.mockResolvedValue(false)
    await createImpsReturnFile(acknowledgements, filename, transaction)
    expect(updateSequence).toHaveBeenCalledWith({ schemeId: IMPS, nextReturn: sequence }, transaction)
    expect(publishReturnFile).not.toHaveBeenCalled()
  })

  test('should call setImpsAcknowledgementsExported if useV2ReturnFiles is true', async () => {
    await createImpsReturnFile(acknowledgements, filename, transaction)
    expect(setImpsAcknowledgementsExported).toHaveBeenCalledWith(acknowledgements, transaction)
  })

  test('should not call setImpsAcknowledgementsExported if useV2ReturnFiles is false', async () => {
    config.useV2ReturnFiles = false
    await createImpsReturnFile(acknowledgements, filename, transaction)
    expect(setImpsAcknowledgementsExported).not.toHaveBeenCalled()
  })

  test('should call getImpsPendingAcknowledgements when useV2ReturnFiles is true', async () => {
    await createImpsReturnFile(acknowledgements, filename, transaction)
    expect(getImpsPendingAcknowledgements).toHaveBeenCalledWith(sequence, transaction)
  })
})
