const { GET } = require('../../../../../app/constants/methods')
const { OK } = require('../../../../../app/constants/ok')

let server

describe('healthz route', () => {
  beforeEach(async () => {
    jest.clearAllMocks()

    const { createServer } = require('../../../../../app/server/create-server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /healthz route returns 200', async () => {
    const options = {
      method: GET,
      url: '/healthz'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /healthz route returns ok when healthy', async () => {
    const options = {
      method: GET,
      url: '/healthz'
    }

    const result = await server.inject(options)
    expect(result.result).toBe(OK)
  })
})
