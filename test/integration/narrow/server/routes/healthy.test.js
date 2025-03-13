const { GET } = require('../../../../../app/constants/methods')
const { OK } = require('../../../../../app/constants/ok')

let server

describe('healthy route', () => {
  beforeEach(async () => {
    jest.clearAllMocks()

    const { createServer } = require('../../../../../app/server/create-server')
    server = await createServer()
    await server.initialize()
  })

  afterEach(async () => {
    await server.stop()
  })

  test('GET /healthy route returns 200', async () => {
    const options = {
      method: GET,
      url: '/healthy'
    }

    const result = await server.inject(options)
    expect(result.statusCode).toBe(200)
  })

  test('GET /healthy route returns ok when healthy', async () => {
    const options = {
      method: GET,
      url: '/healthy'
    }

    const result = await server.inject(options)
    expect(result.result).toBe(OK)
  })
})
