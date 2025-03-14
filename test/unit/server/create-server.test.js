jest.mock('../../../app/config', () => ({
  serverConfig: { isDev: true }
}))

const Hapi = require('@hapi/hapi')
const { createServer } = require('../../../app/server/create-server')
const blipp = require('blipp')

describe('Create Server', () => {
  test('Should register blipp when in development mode', async () => {
    const mockRegister = jest.fn()

    jest.spyOn(Hapi, 'server').mockReturnValue({
      register: mockRegister,
      start: jest.fn(),
      route: jest.fn()
    })

    await createServer()

    expect(mockRegister).toHaveBeenCalledWith(blipp)
  })
})
