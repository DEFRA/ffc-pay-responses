const { isImpsReturnFile } = require('../../../../../app/processing/returns/imps/is-imps-return-file')

describe('is IMPS return file', () => {
  test.each([
    ['RET_IMPS_AP_12345.INT', true],
    ['RET_IMPS_AP_12345.TXT', false],
    ['RET_OTHER_AP_12345.INT', false],
    ['somepath/RET_IMPS_AP_12345.INT', true],
    ['somepath/OTHER_FILE_12345.INT', false]
  ])('returns %p for filename %s', (filename, expected) => {
    expect(isImpsReturnFile(filename)).toBe(expected)
  })
})
