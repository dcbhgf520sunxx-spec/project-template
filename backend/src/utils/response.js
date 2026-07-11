function envelope(res, status, code, message, data = null) {
  return res.status(status).json({
    code,
    message,
    data,
    requestId: res.locals?.requestId
  })
}

function ok(res, data, message = 'success') {
  return envelope(res, 200, 0, message, data)
}

function fail(res, status, code, message, data = null) {
  return envelope(res, status, code, message, data)
}

function isEnvelope(body) {
  return body && typeof body === 'object' && typeof body.code === 'number' && Object.hasOwn(body, 'data')
}

function attachResponseHelpers(req, res, next) {
  const json = res.json.bind(res)

  res.ok = (data, message = 'success') => ok(res, data, message)
  res.fail = (status, code, message, data = null) => fail(res, status, code, message, data)
  res.json = (body) => {
    if (isEnvelope(body) && body.requestId === undefined) {
      return json({ ...body, requestId: res.locals?.requestId })
    }
    return json(body)
  }

  next()
}

module.exports = { attachResponseHelpers, ok, fail }
