const { isPaymentFile } = require('../../../../app/processing/payments/is-payment-file')

const paymentFiles = [
  'FFCSFIP_0001_AP_20220329120821 (SITISFI).csv',
  'FFCSFIP_0001_AR_20220329120821 (SITISFI).csv'
]
const returnFile = 'FFCSITI_SFI Return File.csv'
const acknowledgementFile = 'FFC_001_Ack.xml'

describe('is payment file', () => {
  const invalidFiles = [undefined, null, 1, 'file.pdf', returnFile, acknowledgementFile]

  test.each(invalidFiles)('returns false for invalid filename: %p', (filename) => {
    expect(isPaymentFile(filename)).toBe(false)
  })

  test.each(paymentFiles)('returns true for valid payment file: %s', (filename) => {
    expect(isPaymentFile(filename)).toBe(true)
  })
})
