const transientCodes = new Set(['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'EAI_AGAIN', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET'])
function transient(error) {
  const status = error.httpStatus || (typeof error.status === 'number' && error.status >= 400 ? error.status : 0)
  if (status) return [408, 500, 502, 503, 504].includes(status)
  if (transientCodes.has(error.code) || ['TimeoutError'].includes(error.name)) return true
  if (error.cause && transient(error.cause)) return true
  const text = `${error.message || ''} ${error.stderr || ''}`
  if (/certificate|permission denied|authentication failed|repository not found|HTTP 40[134]/i.test(text)) return false
  return /TLS handshake timeout|timed?\s*out|connection reset|temporary failure|unexpected EOF|HTTP (408|50[0234])|HTTP[^\n]*returned error: (408|50[0234])/i.test(text)
}
const delay = attempt => 500 * 2 ** attempt + Math.floor(Math.random() * 200)
function retrySync(fn, { attempts = 3, sleep = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms), onRetry = () => console.error('Temporary download/read failure; retrying…') } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return fn(attempt) } catch (error) {
      if (attempt + 1 >= attempts || !transient(error)) throw error
      onRetry(attempt + 1); sleep(delay(attempt))
    }
  }
}
async function retryAsync(fn, { attempts = 3, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), onRetry = () => console.error('Temporary download/read failure; retrying…') } = {}) {
  for (let attempt = 0; ; attempt++) {
    try { return await fn(attempt) } catch (error) {
      if (attempt + 1 >= attempts || !transient(error)) throw error
      onRetry(attempt + 1); await sleep(delay(attempt))
    }
  }
}
module.exports = { transient, retrySync, retryAsync }
