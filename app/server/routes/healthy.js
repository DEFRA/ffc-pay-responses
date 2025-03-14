const { OK } = require('../../constants/ok')
const { OK: statusOK } = require('../../constants/status-codes')
const { GET } = require('../../constants/methods')

module.exports = {
  method: GET,
  path: '/healthy',
  handler: (_request, h) => {
    return h.response(OK).code(statusOK)
  }
}
