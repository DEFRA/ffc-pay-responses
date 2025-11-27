const { isImpsAcknowledgementFile } = require('../../../../app/processing/acknowledgements/is-imps-acknowledgement-file')

describe('isImpsAcknowledgementFile', () => {
  test.each([
    ['undefined filename', undefined, false],
    ['null filename', null, false],
    ['numeric filename', 1, false],
    ['non-xml file', 'FFC_001_Ack.csv', false],
    ['non-IMPS acknowledgement file', 'FFC_001_Ack.xml', false],
    ['IMPS acknowledgement file', 'FFC_001_IMPS_Ack.xml', true]
  ])('%s', (_, filename, expected) => {
    expect(isImpsAcknowledgementFile(filename)).toBe(expected)
  })
})
