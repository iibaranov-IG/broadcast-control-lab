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

function reader({ env = process.env, execute = execFileSync, request = fetch } = {}) {
  // Resolve once per command, keeping credentials in memory only.
  const token = credentials(env, execute)
  return async endpoint => {
    if (!/^repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\//.test(endpoint) || endpoint.includes('..')) throw new Error('Invalid GitHub repository API path')
    return retryAsync(async () => {
      const response = await request(`https://api.github.com/${endpoint}`, {
        headers: { Accept: 'application/vnd.github+json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        signal: AbortSignal.timeout(30000), redirect: 'error',
      })
      if (!response.ok) {
        const limited = response.status === 429 || (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0')
        const hint = limited ? (token ? ' Authenticated API limit reached; retry after the GitHub rate-limit reset.' : ' Anonymous API limit reached; run gh auth login or set GH_TOKEN/GITHUB_TOKEN and retry.') : ''
        const error = new Error(`GitHub read failed: ${response.status}.${hint}`)
        error.httpStatus = response.status
        throw error
      }
      return response.json()
    })
  }
}
module.exports = { credentials, reader }
