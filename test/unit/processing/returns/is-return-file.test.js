const { isReturnFile } = require('../../../../app/processing/returns/is-return-file')

const paymentFiles = [
  'FFCSFIP_0001_AP_20220329120821 (SITISFI).csv',
  'FFCSFIP_0001_AR_20220329120821 (SITISFI).csv'
]
const returnFiles = [
  'FFCSITI_SFI Return File.csv',
  'FFCGENESISPayConf_23071 21211_SF01-012825.gni',
  'FFCFCAP_sequence_RPA_20230621 21008.dat',
  'FFCRET_IMPS_AP_SF01-012674_GBP.INT'
]
const invalidFiles = [
  undefined,
  null,
  1,
  'FFCSITI_SFI Return File.pdf',
  'FFC_001_Ack.xml',
  ...paymentFiles
]

describe('isReturnFile', () => {
  test.each(returnFiles)('should return true for valid return file: %s', (filename) => {
    expect(isReturnFile(filename)).toBe(true)
  })

  test.each(invalidFiles)('should return false for invalid return file: %s', (filename) => {
    expect(isReturnFile(filename)).toBe(false)
  })
})
