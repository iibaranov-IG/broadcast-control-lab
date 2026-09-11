import test from 'node:test'
import assert from 'node:assert/strict'
import { credentials, reader } from '../scripts/github-read.cjs'

test('environment credentials take precedence without invoking gh', () => {
  const execute = () => { throw new Error('must not execute') }
  assert.equal(credentials({ GH_TOKEN: 'first', GITHUB_TOKEN: 'second' }, execute), 'first')
  assert.equal(credentials({ GITHUB_TOKEN: 'second' }, execute), 'second')
})
test('gh credentials use fixed hostname and bounded noninteractive execution', () => {
  assert.equal(credentials({}, (program, args, options) => {
    assert.equal(program, 'gh')
    assert.deepEqual(args, ['auth', 'token', '--hostname', 'github.com'])
    assert.equal(options.timeout, 5000)
    assert.equal(options.env.GH_PROMPT_DISABLED, '1')
    assert.deepEqual(options.stdio, ['ignore', 'pipe', 'pipe'])
    return 'saved-token\n'
  }), 'saved-token')
  assert.equal(credentials({}, () => { throw new Error('not logged in') }), '')
})
test('reader resolves credentials once and authenticates both scaffold reads', async () => {
  let resolutions = 0, requests = 0
  const read = reader({ env: {}, execute: () => { resolutions++; return 'secret' }, request: async (url, opts) => {
    requests++
    assert.ok(url.startsWith('https://api.github.com/repos/team/project/'))
    assert.equal(opts.headers.Authorization, 'Bearer secret')
    assert.equal(opts.redirect, 'error')
    return { ok: true, json: async () => ({ ok: true }) }
  } })
  await read('repos/team/project/issues/12')
  await read('repos/team/project/commits?per_page=1')
  assert.equal(resolutions, 1)
  assert.equal(requests, 2)
  await assert.rejects(read('https://example.com'), /Invalid/)
})
test('reader accepts repository metadata roots but rejects lookalike prefixes', async () => {
  const urls = []
  const read = reader({ env: {}, execute: () => 'secret', request: async url => { urls.push(url); return { ok: true, json: async () => ({ ok: true }) } } })
  await read('repos/team/project')
  assert.equal(urls[0], 'https://api.github.com/repos/team/project')
  await assert.rejects(read('repos/team/project-lookalike?x=1'), /Invalid/)
})
test('anonymous limit is actionable and never retried; tokens do not enter errors', async () => {
  for (const token of ['', 'private-secret']) {
    let calls = 0
    const read = reader({ maxWaitMs: 0, env: { GH_TOKEN: token }, execute: () => '', request: async (_, opts) => {
      calls++
      assert.equal(opts.headers.Authorization, token ? `Bearer ${token}` : undefined)
      return { ok: false, status: 403, headers: new Headers({ 'x-ratelimit-remaining': '0' }) }
    } })
    await assert.rejects(read('repos/team/project/issues/12'), error => {
      assert.equal(error.httpStatus, 403)
      assert.match(error.message, token ? /Authenticated API limit/ : /gh auth login/)
      assert.ok(!error.message.includes('private-secret'))
      return true
    })
    assert.equal(calls, 1)
  }
})
test('rate limit waits using reset headers and resumes; permission denial does not wait', async () => {
  const waits = [], notices = []
  let count = 0
  const read = reader({ env: {}, execute: () => '', now: () => 1000, sleep: async ms => waits.push(ms), notice: s => notices.push(s), request: async () => ++count === 1
    ? { ok: false, status: 403, headers: new Headers({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '3' }) }
    : { ok: true, json: async () => ({ resumed: true }) } })
  assert.deepEqual(await read('repos/team/project/issues/12'), { resumed: true })
  assert.deepEqual(waits, [3000])
  assert.equal(notices.length, 1)
  const denied = reader({ env: {}, execute: () => '', sleep: async () => assert.fail('must not wait'), request: async () => ({ ok: false, status: 403, headers: new Headers() }) })
  await assert.rejects(denied('repos/team/project/issues/12'), /403/)
})
