const { getImpsBatchNumber } = require('../../../app/messaging/get-imps-batch-number')

describe('getImpsBatchNumber', () => {
  test.each([
    ['extracts number between last underscore and extension', 'IMPS_2023_001.txt', 1],
    ['handles last underscore when multiple exist', 'IMPS_2023_04_12345.dat', 12345],
    ['handles last underscore when 7 digit sequences exist', 'IMPS_2023_04_1234567.dat', 1234567],
    ['handles numbers incorrectly at different positions', 'prefix_middle_9876_suffix.txt', NaN],
    ['handles different file extensions', 'IMPS_456.csv', 456],
    ['removes leading zeros', 'IMPS_00123.txt', 123]
  ])('%s', (_, filename, expected) => {
    const result = getImpsBatchNumber(filename)
    if (Number.isNaN(expected)) {
      expect(result).toBeNaN()
    } else {
      expect(result).toBe(expected)
    }
  })
})
