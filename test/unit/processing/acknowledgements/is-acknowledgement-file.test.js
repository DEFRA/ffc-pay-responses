const { isAcknowledgementFile } = require('../../../../app/processing/acknowledgements/is-acknowledgement-file')

describe('isAcknowledgementFile', () => {
  test.each([
    ['undefined filename', undefined, false],
    ['null filename', null, false],
    ['numeric filename', 1, false],
    ['non-xml file', 'FFC_001_Ack.csv', false],
    ['return file', 'FFCSITI_SFI Return File.csv', false],
    ['AP payment file', 'FFCSFIP_0001_AP_20220329120821 (SITISFI).csv', false],
    ['AR payment file', 'FFCSFIP_0001_AR_20220329120821 (SITISFI).csv', false],
    ['acknowledgement file', 'FFC_001_Ack.xml', true]
  ])('%s', (_, filename, expected) => {
    expect(isAcknowledgementFile(filename)).toBe(expected)
  })
})
