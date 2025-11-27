const { convertToPence, convertToPounds } = require('../../app/currency-convert')

describe('convert currency', () => {
  test.each([
    [100, 10000],
    [100.10, 10010],
    [100.1, 10010],
    ['100', 10000],
    ['100.10', 10010],
    ['100.1', 10010]
  ])('convertToPence(%s) should return %i', (input, expected) => {
    expect(convertToPence(input)).toBe(expected)
  })

  test.each([
    [10000, '100.00'],
    [10010, '100.10']
  ])('convertToPounds(%i) should return %s', (input, expected) => {
    expect(convertToPounds(input)).toBe(expected)
  })
})
