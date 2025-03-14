const Hapi = require('@hapi/hapi')
const plugin = require('../../../../../app/server/plugins/errors').plugin

describe('Errors Plugin', () => {
  let server

  beforeAll(async () => {
    server = Hapi.server()
    await server.register(plugin)

    server.route({
      method: 'GET',
      path: '/error',
      handler: () => {
        throw new Error('Test error')
      }
    })
  })

  afterAll(async () => {
    await server.stop()
  })

  test('should log errors when an error response is returned', async () => {
    const requestLogSpy = jest.fn()

    server.ext('onRequest', (request, h) => {
      request.log = requestLogSpy
      return h.continue
    })

    const response = await server.inject({
      method: 'GET',
      url: '/error'
    })

    expect(response.statusCode).toBe(500)

    expect(requestLogSpy).toHaveBeenCalledWith('error', expect.objectContaining({
      statusCode: 500,
      message: 'Test error',
      payloadMessage: ''
    }))
  })
})
