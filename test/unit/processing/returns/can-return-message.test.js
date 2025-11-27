const { canReturnMessage } = require('../../../../app/processing/returns/can-return-message')

describe('canReturnMessage', () => {
  test.each([
    ['example.txt', true],
    ['anotherfile.doc', true],
    ['NO_RETURN_MESSAGE_example.txt', false],
    ['example_NO_RETURN_MESSAGE.txt', false],
    ['example_NO_RETURN_MESSAGE_test.txt', false],
    ['testNO_RETURN_MESSAGEexample.txt', false]
  ])('should return %s → %s', (filename, expected) => {
    expect(canReturnMessage(filename)).toBe(expected)
  })
})
