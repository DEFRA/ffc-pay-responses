jest.mock('../../../app/data', () => ({
  sequelize: {
    transaction: jest.fn()
  },
  impsBatchNumber: {
    create: jest.fn()
  }
}))

jest.mock('../../../app/messaging/get-existing-imps-submission')
jest.mock('../../../app/messaging/get-imps-batch-number')
jest.mock('../../../app/event/send-respones-failure-event')
jest.mock('../../../app/constants/events', () => ({
  REPSONSES_PROCESSING_FAILED: 'responses-processing-failed'
}))

const db = require('../../../app/data')
const { getExistingImpsSubmission } = require('../../../app/messaging/get-existing-imps-submission')
const { getImpsBatchNumber } = require('../../../app/messaging/get-imps-batch-number')
const { sendResponsesFailureEvent } = require('../../../app/event/send-respones-failure-event')
const { saveImpsSubmission } = require('../../../app/messaging/save-imps-submission')

describe('saveImpsSubmission', () => {
  let mockTransaction
  const paymentRequest = {
    invoiceNumber: 'INV-123',
    frn: 'FRN-456',
    batch: 'BATCH-001'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn()
    }
    db.sequelize.transaction.mockResolvedValue(mockTransaction)
  })

  test('saves new IMPS submission and commits transaction', async () => {
    getExistingImpsSubmission.mockResolvedValue(null)
    getImpsBatchNumber.mockReturnValue('BATCH-NUM-789')

    await saveImpsSubmission(paymentRequest)

    expect(getExistingImpsSubmission).toHaveBeenCalledWith(
      'INV-123',
      'FRN-456',
      'BATCH-001',
      mockTransaction
    )
    expect(getImpsBatchNumber).toHaveBeenCalledWith('BATCH-001')
    expect(db.impsBatchNumber.create).toHaveBeenCalledWith(
      { ...paymentRequest, batchNumber: 'BATCH-NUM-789' },
      { transaction: mockTransaction }
    )
    expect(mockTransaction.commit).toHaveBeenCalled()
    expect(mockTransaction.rollback).not.toHaveBeenCalled()
  })

  test('rolls back transaction for duplicate IMPS submission', async () => {
    getExistingImpsSubmission.mockResolvedValue({ id: 'existing-123' })

    await saveImpsSubmission(paymentRequest)

    expect(mockTransaction.rollback).toHaveBeenCalled()
    expect(mockTransaction.commit).not.toHaveBeenCalled()
    expect(db.impsBatchNumber.create).not.toHaveBeenCalled()
  })

  test('handles error by rolling back and sending failure event', async () => {
    const error = new Error('Database error')
    getExistingImpsSubmission.mockRejectedValue(error)

    await expect(saveImpsSubmission(paymentRequest)).rejects.toThrow('Database error')

    expect(mockTransaction.rollback).toHaveBeenCalled()
    expect(sendResponsesFailureEvent).toHaveBeenCalledWith(
      'INV-123',
      'responses-processing-failed',
      'Database error'
    )
  })
})
