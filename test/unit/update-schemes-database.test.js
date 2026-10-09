jest.mock('ffc-pay-schemes', () => ({
  getSchemes: jest.fn()
}))
const { getSchemes: mockGetSchemes } = require('ffc-pay-schemes')

const { createKnexMock, createQueryBuilder } = require('../helpers/mock-knex')
const mockDb = createKnexMock(['schemes'])

jest.mock('../../app/database', () => ({
  client: mockDb.knex,
  transaction: mockDb.transaction,
  close: mockDb.close,
  ...mockDb.tables
}))

const { updateSchemesDatabase } = require('../../app/update-schemes-database')

describe('update schemes database', () => {
  let consoleLogSpy

  beforeEach(() => {
    jest.clearAllMocks()
    mockDb.builder.resolves(null)
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation()
  })

  afterEach(() => {
    consoleLogSpy.mockRestore()
  })

  test('should get the schemes', async () => {
    mockGetSchemes.mockReturnValue([])

    await updateSchemesDatabase()

    expect(mockGetSchemes).toHaveBeenCalledTimes(1)
  })

  test('should check whether a scheme already exists before upserting', async () => {
    const scheme = {
      schemeId: 1,
      schemeName: 'Sustainable Farming Incentive 22'
    }

    mockGetSchemes.mockReturnValue([scheme])

    await updateSchemesDatabase()

    expect(mockDb.tables.schemes).toHaveBeenCalled()
    expect(mockDb.builder.where).toHaveBeenCalledWith({ schemeId: scheme.schemeId })
    expect(mockDb.builder.first).toHaveBeenCalled()
  })

  test('should create a record for a new scheme', async () => {
    const scheme = {
      schemeId: 1,
      schemeName: 'Sustainable Farming Incentive 22'
    }

    mockGetSchemes.mockReturnValue([scheme])

    await updateSchemesDatabase()

    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      name: scheme.schemeName
    })
    expect(mockDb.builder.onConflict).toHaveBeenCalledWith('schemeId')
    expect(mockDb.builder.merge).toHaveBeenCalledTimes(1)

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `${scheme.schemeName} created`
    )
  })

  test('should update an existing scheme record', async () => {
    const scheme = {
      schemeId: 1,
      schemeName: 'Updated scheme name'
    }

    mockGetSchemes.mockReturnValue([scheme])
    mockDb.builder.resolves({ schemeId: scheme.schemeId })

    await updateSchemesDatabase()

    expect(mockDb.builder.insert).toHaveBeenCalledWith({
      schemeId: scheme.schemeId,
      name: scheme.schemeName
    })

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `${scheme.schemeName} updated`
    )
  })

  test('should upsert every scheme', async () => {
    const schemes = [
      { schemeId: 1, schemeName: 'Scheme one' },
      { schemeId: 2, schemeName: 'Scheme two' }
    ]

    mockGetSchemes.mockReturnValue(schemes)

    await updateSchemesDatabase()

    expect(mockDb.tables.schemes).toHaveBeenCalledTimes(schemes.length * 2)

    for (const scheme of schemes) {
      expect(mockDb.builder.insert).toHaveBeenCalledWith({
        schemeId: scheme.schemeId,
        name: scheme.schemeName
      })
    }
  })

  test('should log that it is checking for updates', async () => {
    mockGetSchemes.mockReturnValue([])

    await updateSchemesDatabase()

    expect(consoleLogSpy).toHaveBeenCalledWith(
      'Checking for updates to supported schemes'
    )
  })

  test('should process schemes sequentially', async () => {
    const schemes = [
      { schemeId: 1, schemeName: 'Scheme one' },
      { schemeId: 2, schemeName: 'Scheme two' }
    ]

    mockGetSchemes.mockReturnValue(schemes)

    await updateSchemesDatabase()

    const insertedIds = mockDb.builder.insert.mock.calls.map(([row]) => row.schemeId)
    expect(insertedIds).toEqual([1, 2])
  })

  test('should reject if scheme lookup fails', async () => {
    const error = new Error('Lookup error')

    mockGetSchemes.mockReturnValue([{
      schemeId: 1,
      schemeName: 'Scheme one'
    }])
    mockDb.builder.rejects(error)

    await expect(updateSchemesDatabase()).rejects.toBe(error)
  })

  test('should reject if upsert fails', async () => {
    const error = new Error('Database error')
    const lookupBuilder = createQueryBuilder().resolves(null)
    const upsertBuilder = createQueryBuilder().rejects(error)

    mockGetSchemes.mockReturnValue([{
      schemeId: 1,
      schemeName: 'Scheme one'
    }])
    mockDb.tables.schemes.mockReturnValueOnce(lookupBuilder).mockReturnValueOnce(upsertBuilder)

    await expect(updateSchemesDatabase()).rejects.toBe(error)
  })
})
