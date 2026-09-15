import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import retry from '../scripts/retry.cjs'
import templates from '../scripts/templates.cjs'
import tracking from '../scripts/tracking.cjs'
import { scaffold } from '../scripts/bcl.cjs'
const quiet = { sleep: () => {}, onRetry: () => {} }
function temp(t) { const p = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-automation-test-')); t.after(() => fs.rmSync(p, { recursive: true, force: true })); return p }
test('Read retry recovers TLS timeout, is bounded, and never retries denied access', async () => {
  let calls = 0
  assert.equal(retry.retrySync(() => { if (++calls < 3) throw new Error('TLS handshake timeout'); return 'ok' }, quiet), 'ok')
  assert.equal(calls, 3)
  for (const status of [401, 403, 404, 422]) {
    calls = 0
    assert.throws(() => retry.retrySync(() => { calls++; throw Object.assign(new Error('timeout'), { httpStatus: status }) }, quiet))
    assert.equal(calls, 1)
  }
  calls = 0
  await assert.rejects(retry.retryAsync(async () => { calls++; throw Object.assign(new Error('Busy'), { httpStatus: 503 }) }, quiet))
  assert.equal(calls, 3)
  assert.equal(retry.transient(new Error('certificate verify failed')), false)
})
for (const language of ['node', 'python', 'cpp']) test(`${language} template generates executable failing evidence without inventing acceptance`, t => {
  const root = temp(t)
  const c = scaffold('https://github.com/example/project/issues/1', 'a'.repeat(40), 'Example')
  const files = templates.generate(c, { language, protocol: 'none' })
  const dir = path.join(root, 'cases', c.id); fs.mkdirSync(dir, { recursive: true })
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), content)
  const result = spawnSync(process.execPath, [`cases/${c.id}/test.mjs`], { cwd: root, encoding: 'utf8', timeout: 15000 })
  assert.equal(result.status, 1, result.stderr)
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, c.artifacts.report))).results[0].status, 'FAIL')
  assert.equal(c.status, 'draft')
  assert.equal(c.steps.build[0].cwd, c.sources[0].directory)
})
for (const protocol of ['tcp', 'udp']) test(`${protocol} template runs with the shared stand and cleans up on probe failure`, t => {
  const root = temp(t), c = scaffold('https://github.com/example/project/issues/2', 'a'.repeat(40), 'Network example')
  const dir = path.join(root, 'cases', c.id); fs.mkdirSync(dir, { recursive: true })
  fs.cpSync(fileURLToPath(new URL('../lib', import.meta.url)), path.join(root, 'lib'), { recursive: true })
  for (const [name, content] of Object.entries(templates.generate(c, { language: 'node', protocol }))) fs.writeFileSync(path.join(dir, name), content)
  const result = spawnSync(process.execPath, [`cases/${c.id}/test.mjs`], { cwd: root, encoding: 'utf8', timeout: 15000 })
  assert.equal(result.status, 1, result.stderr)
  const report = JSON.parse(fs.readFileSync(path.join(root, c.artifacts.report)))
  assert.equal(report.results[0].status, 'FAIL')
  assert.ok(Array.isArray(report.transcript))
})
test('Unknown templates fail before generating files', () => assert.throws(() => templates.options(['--template', 'unknown']), /Unknown/))
function setup(t) {
  const root = temp(t), c = { id: 'example-1', title: 'Repair', issue: 'https://github.com/up/project/issues/1' }
  fs.writeFileSync(path.join(root, 'REPAIRS.md'), '# Existing manual board\n\nKeep this entry.\n')
  const db = { schemaVersion: 1, repairs: [] }
  tracking.register(db, c, { url: 'https://github.com/up/project/pull/2', state: 'open', headSha: 'a'.repeat(40) }, 'b'.repeat(64))
  tracking.save(root, db)
  return { root, c, db, entry: db.repairs[0] }
}
function fakeApi({ comment = 'It works!', updated = '2026-09-11T01:00:00Z', fail = false } = {}) {
  return (method, endpoint) => {
    assert.equal(method, 'GET')
    if (fail) throw new Error('HTTP 503')
    if (endpoint.endsWith('/pulls/2')) return { state: 'open', draft: false, created_at: '2026-09-10T01:00:00Z', merged_at: null, head: { sha: 'a'.repeat(40) } }
    if (endpoint.endsWith('/issues/1')) return { created_at: '2026-09-01T01:00:00Z', user: { login: 'owner' } }
    if (endpoint.includes('/issues/1/comments')) return [{ id: 1, body: comment, updated_at: updated, html_url: 'https://github.com/up/project/issues/1#issuecomment-1', user: { login: 'owner' } }]
    if (endpoint.includes('/check-runs')) return { check_runs: [{ status: 'completed', conclusion: 'success' }] }
    if (endpoint.endsWith('/status')) return { total_count: 0, state: 'pending' }
    return []
  }
}
test('Publication registration is idempotent and preserves manual board content', t => {
  const f = setup(t)
  tracking.register(f.db, f.c, { url: f.entry.pr }, 'b'.repeat(64))
  tracking.save(f.root, f.db)
  assert.equal(f.db.repairs.length, 1)
  const board = fs.readFileSync(path.join(f.root, 'REPAIRS.md'), 'utf8')
  assert.match(board, /Keep this entry/)
  assert.equal((board.match(/BCL:TRACKING:START/g) || []).length, 1)
  assert.equal(tracking.render(board, f.db), board)
  f.db.repairs.push({ ...f.entry })
  fs.writeFileSync(path.join(f.root, 'tracking/repairs.json'), JSON.stringify(f.db))
  assert.throws(() => tracking.read(f.root), /Duplicate PR/)
})
test('evidence publication replaces an earlier PR for the same case', t => {
  const f = setup(t)
  const replacement = 'https://github.com/up/project/pull/3'
  tracking.register(f.db, f.c, { url: replacement, state: 'open', headSha: 'c'.repeat(40) }, 'b'.repeat(64), 'https://github.com/run/1')
  assert.equal(f.db.repairs.length, 1)
  assert.equal(f.entry.pr, replacement)
  assert.equal(f.entry.testedHeadSha, 'c'.repeat(40))
  assert.equal(f.entry.evidenceStatus, 'BOUND_CANDIDATE')
})
test('review fixes replace evidence for the same case and PR while preserving its audit trail', t => {
  const f = setup(t)
  f.entry.run = 'https://github.com/run/old'
  f.entry.hardware = { status: 'REPORTED_PASS', report: { observed: 'Worked on old bytes' } }
  tracking.register(f.db, f.c, { url: f.entry.pr, state: 'open', headSha: 'c'.repeat(40) }, 'd'.repeat(64), 'https://github.com/run/new')
  assert.equal(f.db.repairs.length, 1)
  assert.equal(f.entry.candidateSha256, 'd'.repeat(64))
  assert.equal(f.entry.testedHeadSha, 'c'.repeat(40))
  assert.equal(f.entry.run, 'https://github.com/run/new')
  assert.equal(f.entry.evidenceStatus, 'BOUND_CANDIDATE')
  assert.equal(f.entry.hardware.status, 'STALE')
  assert.equal(f.entry.hardware.priorStatus, 'REPORTED_PASS')
  assert.deepEqual(f.entry.priorCandidates, [{
    candidateSha256: 'b'.repeat(64),
    testedHeadSha: 'a'.repeat(40),
    run: 'https://github.com/run/old',
  }])
})
test('one PR can never be registered to two cases', t => {
  const f = setup(t)
  assert.throws(() => tracking.register(f.db, { ...f.c, id: 'other-2' }, { url: f.entry.pr }, 'd'.repeat(64)), /identity conflict/)
  assert.equal(f.db.repairs.length, 1)
})
test('a signed replacement commit keeps evidence bound when tree and parent are unchanged', t => {
  const f = setup(t)
  const tree = 'c'.repeat(40), parent = 'd'.repeat(40), signedHead = 'e'.repeat(40)
  f.entry.testedTreeSha = tree
  f.entry.testedParentSha = parent
  const api = fakeApi()
  const refreshed = tracking.syncEntry(f.entry, (method, endpoint) => {
    if (endpoint.endsWith(`/git/commits/${signedHead}`)) return { tree: { sha: tree }, parents: [{ sha: parent }] }
    if (endpoint.endsWith('/pulls/2')) return { state: 'open', draft: true, created_at: '2026-09-10T01:00:00Z', merged_at: null, head: { sha: signedHead } }
    return api(method, endpoint)
  }, '2026-09-15T01:00:00Z')
  assert.equal(refreshed.evidenceStatus, 'BOUND_CANDIDATE')
  assert.equal(refreshed.testedHeadSha, signedHead)
  assert.equal(refreshed.state, 'draft')
})
test('Replies are unread, edits reopen them, and positive prose never verifies hardware', t => {
  const f = setup(t)
  assert.equal(tracking.sync(f.root, fakeApi()).unread, 1)
  let entry = tracking.read(f.root).repairs[0]
  assert.equal(entry.events[0].reporter, true)
  assert.equal(entry.hardware.status, 'NOT_REVIEWED')
  assert.equal(entry.ci, 'success')
  tracking.acknowledge(f.root, f.c.id)
  assert.equal(tracking.sync(f.root, fakeApi()).unread, 0)
  assert.equal(tracking.sync(f.root, fakeApi({ comment: 'Actually still broken', updated: '2026-09-12T01:00:00Z' })).unread, 1)
})
test('repair metrics report velocity beside acceptance and evidence quality', t => {
  const f = setup(t)
  const triage = path.join(f.root, 'cases', f.c.id)
  fs.mkdirSync(triage, { recursive: true })
  fs.writeFileSync(path.join(triage, 'triage.json'), JSON.stringify({ checkedAt: '2026-09-09T01:00:00Z' }))
  tracking.sync(f.root, fakeApi())
  const report = tracking.metrics(f.root)
  assert.equal(report.summary.tracked, 1)
  assert.equal(report.summary.ciSuccessPercent, 100)
  assert.equal(report.summary.evidenceBoundPercent, 100)
  assert.equal(report.summary.medianIssueToPrHours, 216)
  assert.equal(report.repairs[0].issueToPrHours, 216)
  assert.equal(report.summary.medianSelectedToPrHours, 24)
  assert.equal(report.summary.medianPrToReporterResponseHours, 24)
})
test('Failed refresh preserves prior events and records stale state explicitly', t => {
  const f = setup(t); tracking.sync(f.root, fakeApi())
  const before = tracking.read(f.root).repairs[0]
  assert.equal(tracking.sync(f.root, fakeApi({ fail: true })).errors.length, 1)
  const after = tracking.read(f.root).repairs[0]
  assert.deepEqual(after.events, before.events)
  assert.equal(after.lastSync, before.lastSync)
  assert.match(after.syncError, /503/)
})
test('Hardware results bind to an explicit candidate and preserve reported vs verified distinction', t => {
  const f = setup(t), filename = path.join(f.root, 'owner.json')
  const report = { case: f.c.id, candidateSha256: 'c'.repeat(64), result: 'PASS', deviceModel: 'Device', firmware: '1', applicationVersion: '2', steps: 'Run owner check', observed: 'Expected response' }
  fs.writeFileSync(filename, JSON.stringify(report))
  assert.throws(() => tracking.importHardware(f.root, f.c.id, filename), /No tracked candidate/)
  report.candidateSha256 = 'b'.repeat(64); fs.writeFileSync(filename, JSON.stringify(report))
  tracking.importHardware(f.root, f.c.id, filename)
  assert.equal(tracking.read(f.root).repairs[0].hardware.status, 'REPORTED_PASS')
})
test('Tracking reads beyond the first comment page', t => {
  const f = setup(t), base = fakeApi()
  const api = (method, endpoint) => endpoint.includes('/issues/1/comments') ? (endpoint.endsWith('page=1') ? Array.from({ length: 100 }, (_, id) => ({ id, updated_at: 'now', body: 'text' })) : [{ id: 100, updated_at: 'now', body: 'last' }]) : base(method, endpoint)
  assert.equal(tracking.sync(f.root, api).unread, 101)
})
test('Remote board update rebases registration after a concurrent writer, preserving their rows', t => {
  const f = setup(t)
  fs.writeFileSync(path.join(f.root, 'bcl.config.json'), JSON.stringify({ boardRepository: 'me/bcl' }))
  let head = 'first', refWrites = 0, posted
  const concurrent = { schemaVersion: 1, repairs: [{ ...f.entry, id: 'other-3', pr: 'https://github.com/up/project/pull/3' }] }
  const api = (method, endpoint, body) => {
    if (endpoint === 'repos/me/bcl') return { default_branch: 'main' }
    if (method === 'GET' && endpoint.includes('/git/ref/')) return { object: { sha: head } }
    if (endpoint.includes('/git/commits/') && method === 'GET') return { tree: { sha: 'tree' } }
    if (endpoint.includes('/contents/')) return { content: Buffer.from(endpoint.includes('REPAIRS.md') ? '# Manual row\n' : JSON.stringify(head === 'first' ? { schemaVersion: 1, repairs: [] } : concurrent)).toString('base64') }
    if (endpoint.endsWith('/git/trees')) { posted = body; return { sha: 'new-tree' } }
    if (endpoint.endsWith('/git/commits')) return { sha: 'new-commit' }
    if (method === 'PATCH') {
      assert.equal(body.force, false)
      if (++refWrites === 1) { head = 'concurrent'; throw Object.assign(new Error('Race'), { status: 422 }) }
      return {}
    }
    throw new Error(`Unexpected ${method} ${endpoint}`)
  }
  tracking.remoteRegister(f.root, f.c, { url: f.entry.pr }, 'b'.repeat(64), null, api)
  const registry = JSON.parse(posted.tree.find(e => e.path === 'tracking/repairs.json').content)
  assert.deepEqual(registry.repairs.map(r => r.id), ['other-3', 'example-1'])
  assert.equal(refWrites, 2)
  assert.match(posted.tree.find(e => e.path === 'REPAIRS.md').content, /Manual row/)
})
