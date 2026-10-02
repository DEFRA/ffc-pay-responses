const { createKnexMock } = require('../../helpers/mock-knex')
const mockDb = createKnexMock(['impsBatchNumbers'])

jest.mock('../../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

jest.mock('../../../app/messaging/get-existing-imps-submission')
jest.mock('../../../app/messaging/get-imps-batch-number')
jest.mock('../../../app/event/send-respones-failure-event')
jest.mock('../../../app/constants/events', () => ({
  REPSONSES_PROCESSING_FAILED: 'responses-processing-failed'
}))

const { getExistingImpsSubmission } = require('../../../app/messaging/get-existing-imps-submission')
const { getImpsBatchNumber } = require('../../../app/messaging/get-imps-batch-number')
const { sendResponsesFailureEvent } = require('../../../app/event/send-respones-failure-event')
const { saveImpsSubmission } = require('../../../app/messaging/save-imps-submission')

describe('saveImpsSubmission', () => {
  const paymentRequest = {
    invoiceNumber: 'INV-123',
    frn: 'FRN-456',
    batch: 'BATCH-001'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves()
  })

  test('saves new IMPS submission and commits transaction', async () => {
    getExistingImpsSubmission.mockResolvedValue(null)
    getImpsBatchNumber.mockReturnValue('BATCH-NUM-789')

    await saveImpsSubmission(paymentRequest)

    expect(getExistingImpsSubmission).toHaveBeenCalledWith(
      'INV-123',
      'FRN-456',
      'BATCH-001',
      mockDb.trx
    )
    expect(getImpsBatchNumber).toHaveBeenCalledWith('BATCH-001')
    expect(mockDb.tables.impsBatchNumbers).toHaveBeenCalledWith(mockDb.trx)
    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      invoiceNumber: 'INV-123',
      trader: undefined,
      frn: 'FRN-456',
      batch: 'BATCH-001',
      batchNumber: 'BATCH-NUM-789'
    })
    expect(mockDb.trx.commit).toHaveBeenCalled()
    expect(mockDb.trx.rollback).not.toHaveBeenCalled()
  })

  test('rolls back transaction for duplicate IMPS submission', async () => {
    getExistingImpsSubmission.mockResolvedValue({ id: 'existing-123' })

    await saveImpsSubmission(paymentRequest)

    expect(mockDb.trx.rollback).toHaveBeenCalled()
    expect(mockDb.trx.commit).not.toHaveBeenCalled()
    expect(mockDb.builder.insert).not.toHaveBeenCalled()
  })

  test('handles error by rolling back and sending failure event', async () => {
    const error = new Error('Database error')
    getExistingImpsSubmission.mockRejectedValue(error)

    await expect(saveImpsSubmission(paymentRequest)).rejects.toThrow('Database error')

    expect(mockDb.trx.rollback).toHaveBeenCalled()
    expect(sendResponsesFailureEvent).toHaveBeenCalledWith(
      'INV-123',
      'responses-processing-failed',
      'Database error'
    )
  })
})
