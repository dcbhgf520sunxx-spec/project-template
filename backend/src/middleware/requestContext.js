const crypto = require('crypto')

function requestContext(req, res, next) {
  const incomingRequestId = req.get('x-request-id')
  const requestId = incomingRequestId && incomingRequestId.length <= 128
    ? incomingRequestId
    : crypto.randomUUID()

  req.requestId = requestId
  res.locals.requestId = requestId
  res.setHeader('x-request-id', requestId)
  next()
}

module.exports = { requestContext }
