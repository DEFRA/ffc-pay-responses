jest.mock('../../../../app/storage')
const { deleteFile } = require('../../../../app/storage')
const { processPaymentFile } = require('../../../../app/processing/payments/process-payment-file')

const filename = 'FFCSFIP_0001_AP_20220329120821 (SITISFI).csv'
const errorMessage = 'Error when calling delete'

jest.spyOn(console, 'log').mockImplementation()
jest.spyOn(console, 'error').mockImplementation()

describe('process payment file', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('deletes file and logs message', async () => {
    await processPaymentFile(filename)
    expect(deleteFile).toHaveBeenCalledTimes(1)
    expect(deleteFile).toHaveBeenCalledWith(filename)
    expect(console.log).toHaveBeenCalledTimes(1)
    expect(console.log).toHaveBeenCalledWith('Payment file sent from DAX, has been deleted :', filename)
  })

  test('logs error when deleteFile throws', async () => {
    const error = new Error(errorMessage)
    deleteFile.mockRejectedValue(error)
    await processPaymentFile(filename)
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledWith(`Failed to delete payment file: ${filename}`, error)
  })
})
