const Hapi = require('@hapi/hapi')
const Boom = require('@hapi/boom')
const plugin = require('../../../../app/server/plugins/errors').plugin

describe('Errors Plugin', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server()
    await server.register(plugin)

    server.route({
      method: 'GET',
      path: '/regular-error',
      handler: () => {
        throw new Error('Regular test error')
      }
    })

    server.route({
      method: 'GET',
      path: '/boom-error',
      handler: () => {
        throw Boom.badRequest('Hapi Boom test error')
      }
    })
  })

  afterAll(async () => {
    await server.stop()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should log errors when a regular error (non-Boom) occurs', async () => {
    const requestLogSpy = jest.fn()
    server.ext('onRequest', (request, h) => {
      request.log = requestLogSpy
      return h.continue
    })

    const response = await server.inject({
      method: 'GET',
      url: '/regular-error'
    })

    expect(response.statusCode).toBe(500)

    expect(requestLogSpy).toHaveBeenCalledWith('error', expect.objectContaining({
      statusCode: 500,
      message: 'Regular test error',
      payloadMessage: ''
    }))
  })

  test('should log errors when a Boom error occurs (covers isBoom)', async () => {
    const requestLogSpy = jest.fn()

    server.ext('onRequest', (request, h) => {
      request.log = requestLogSpy
      return h.continue
    })

    const response = await server.inject({
      method: 'GET',
      url: '/boom-error'
    })

    expect(response.statusCode).toBe(400)

    expect(requestLogSpy).toHaveBeenCalledWith('error', expect.objectContaining({
      statusCode: 400,
      message: 'Hapi Boom test error',
      payloadMessage: ''
    }))
  })
})
