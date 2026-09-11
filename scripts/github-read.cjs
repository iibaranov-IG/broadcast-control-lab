const { execFileSync } = require('node:child_process')
const { retryAsync } = require('./retry.cjs')

function credentials(env = process.env, execute = execFileSync) {
  const explicit = (env.GH_TOKEN || env.GITHUB_TOKEN || '').trim()
  if (explicit) return explicit
  try {
    return execute('gh', ['auth', 'token', '--hostname', 'github.com'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 5000,
      env: { ...env, GH_PROMPT_DISABLED: '1' },
    }).trim()
  } catch { return '' }
}

function reader({ env = process.env, execute = execFileSync, request = fetch, now = Date.now, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), notice = message => console.error(message), maxWaitMs = 3600000 } = {}) {
  // Resolve once per command, keeping credentials in memory only.
  const token = credentials(env, execute)
  return async endpoint => {
    if (!/^repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/|$)/.test(endpoint) || endpoint.includes('..')) throw new Error('Invalid GitHub repository API path')
    let waited = 0
    for (let attempt = 0; ; attempt++) {
    const response = await retryAsync(async () => {
      const response = await request(`https://api.github.com/${endpoint}`, {
        headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(30000), redirect: 'error',
      })
      if (!response.ok && [408, 500, 502, 503, 504].includes(response.status)) {
        const error = new Error(`GitHub read failed: ${response.status}`); error.httpStatus = response.status; throw error
      }
      return response
    })
      if (!response.ok) {
        const retryAfter = response.headers.get('retry-after')
        const limited = response.status === 429 || (response.status === 403 && (response.headers.get('x-ratelimit-remaining') === '0' || retryAfter !== null))
        if (limited && attempt < 3) {
          const reset = Number(response.headers.get('x-ratelimit-reset')) * 1000
          const retryAt = retryAfter !== null ? (/^\d+$/.test(retryAfter) ? now() + Number(retryAfter) * 1000 : Date.parse(retryAfter)) : reset
          let delay = Number.isFinite(retryAt) && retryAt > now() ? retryAt - now() + 1000 : 60000
          if (waited + delay <= maxWaitMs) {
            notice(`GitHub API limit: waiting ${Math.ceil(delay / 1000)} seconds before resuming this request.`)
            waited += delay
            while (delay > 0) { const chunk = Math.min(delay, 30000); await sleep(chunk); delay -= chunk }
            continue
          }
        }
        const hint = limited ? (token ? ' Authenticated API limit reached; retry after the GitHub rate-limit reset.' : ' Anonymous API limit reached; run gh auth login or set GH_TOKEN/GITHUB_TOKEN and retry.') : ''
        const error = new Error(`GitHub read failed: ${response.status}.${hint}`)
        error.httpStatus = response.status
        throw error
      }
      return response.json()
    }
  }
}
module.exports = { credentials, reader }
