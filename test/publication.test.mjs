import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { execFileSync } from 'node:child_process'
import publication from '../scripts/publication.cjs'
import publisher from '../scripts/publish.cjs'
import { writeEvidence } from '../scripts/evidence.cjs'

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-publication-test-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const src = path.join(root, 'sources/example')
  fs.mkdirSync(src, { recursive: true })
  const git = args => execFileSync('git', ['-C', src, ...args], { encoding: 'utf8' }).trim()
  git(['init', '-q'])
  fs.writeFileSync(path.join(src, 'main.cpp'), 'before\n')
  fs.writeFileSync(path.join(src, 'removed.txt'), 'delete me\n')
  git(['add', '.'])
  git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'baseline'])
  const commit = git(['rev-parse', 'HEAD'])
  fs.writeFileSync(path.join(src, 'main.cpp'), 'after\n')
  fs.writeFileSync(path.join(src, 'added.py'), '#!/usr/bin/env python3\n', { mode: 0o755 })
  fs.unlinkSync(path.join(src, 'removed.txt'))
  const c = { id: 'example', status: 'ready', title: 'Example repair', issue: 'https://github.com/up/project/issues/1', problem: 'Broken behavior', repair: 'Repair it', reproduce: 'Trigger it', acceptance: 'Expected behavior',
    sources: [{ id: 'baseline', repository: 'up/project', commit, directory: 'sources/example' }],
    publish: { source: 'baseline', target: 'up/project', base: 'main', paths: ['main.cpp', 'added.py', 'removed.txt'] },
    verification: { hardwareVerified: false, applicationVerified: false, limitations: 'Simulated only', ownerCheck: 'Check actual equipment' } }
  const directory = path.join(root, 'reports/example')
  fs.mkdirSync(directory, { recursive: true })
  const bytes = publication.capture(root, c)
  fs.writeFileSync(path.join(directory, 'candidate.json'), bytes)
  const e = writeEvidence(root, c, { status: 'PASS', bclRevision: 'a'.repeat(40), tests: [{ name: 'Repair', status: 'PASS' }], stages: [{ name: 'test', status: 'PASS' }], publication: { path: 'candidate.json', sha256: publication.hash(bytes) } })
  const options = { fork: 'me/project', run: 'https://github.com/me/bcl/actions/runs/42' }
  return { root, src, c, directory, e, options, p: publication.plan(directory, c, options) }
}

function github(p) {
  const calls = [], state = { ref: null, prs: [], commits: {}, failure: false }
  const parent = { tree: { sha: 'parent-tree' }, parents: [] }
  const api = (method, endpoint, body) => {
    calls.push({ method, endpoint, body })
    if (method === 'GET' && endpoint === 'repos/up/project') return { full_name: 'up/project' }
    if (method === 'GET' && endpoint === 'repos/me/project') return { source: { full_name: 'up/project' }, permissions: { push: true } }
    if (endpoint === 'repos/up/project/commits/main') return { sha: p.candidate.source.commit }
    if (endpoint.includes('/compare/')) return { status: 'identical' }
    if (method === 'GET' && endpoint.includes('/pulls?')) return state.prs
    if (method === 'GET' && endpoint.includes('/git/commits/')) return endpoint.endsWith(p.candidate.source.commit) ? parent : state.commits[endpoint.split('/').pop()]
    if (method === 'GET' && endpoint.includes('/git/ref/')) {
      if (!state.ref) { const error = new Error('not found'); error.status = 404; throw error }
      return state.ref
    }
    if (method === 'POST' && endpoint.endsWith('/git/blobs')) return { sha: publication.hash(body.content) }
    if (method === 'POST' && endpoint.endsWith('/git/trees')) return { sha: 'candidate-tree' }
    if (method === 'POST' && endpoint.endsWith('/git/commits')) { state.commits.commit = { tree: { sha: body.tree }, parents: body.parents.map(sha => ({ sha })) }; return { sha: 'commit' } }
    if (method === 'POST' && endpoint.endsWith('/git/refs')) { state.ref = { object: { sha: body.sha } }; return state.ref }
    if (method === 'POST' && endpoint.endsWith('/pulls')) {
      if (state.failure) throw new Error('Temporary failure')
      const pr = { ...body, html_url: 'https://github.com/up/project/pull/2', state: 'open' }
      state.prs.push(pr)
      return pr
    }
    throw new Error(`Unexpected ${method} ${endpoint}`)
  }
  return { api, calls, state }
}

test('Capture retains additions, deletions and executable mode; excludes unrelated untracked output', t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.src, 'output.bin'), 'not source')
  const candidate = JSON.parse(publication.capture(f.root, f.c))
  assert.equal(candidate.files.length, 3)
  assert.equal(candidate.files[1].mode, '100755')
  assert.equal(candidate.files[1].prior, null)
  assert.equal(candidate.files[2].content, null)
  assert.match(candidate.files[2].prior, /^[a-f0-9]{40}$/)
  assert.match(f.p.body, /Hardware verified: false/)
  assert.match(f.p.body, /actions\/runs\/42/)
  assert.doesNotMatch(f.p.body, /Fixes #/)
})
test('Publication rejects tampered candidate, stale passport and failed evidence', t => {
  const f = fixture(t)
  const candidate = path.join(f.directory, 'candidate.json'), original = fs.readFileSync(candidate)
  fs.appendFileSync(candidate, ' ')
  assert.throws(() => publication.plan(f.directory, f.c, f.options), /hash mismatch/)
  fs.writeFileSync(candidate, original)
  assert.throws(() => publication.plan(f.directory, { ...f.c, title: 'Changed' }, f.options), /Passport changed/)
  fs.writeFileSync(path.join(f.directory, 'evidence.json'), JSON.stringify({ ...f.e, status: 'FAIL' }))
  assert.throws(() => publication.plan(f.directory, f.c, f.options), /passing evidence/)
})
test('Symlinked source and evidence cannot enter publication', t => {
  const f = fixture(t)
  fs.unlinkSync(path.join(f.src, 'main.cpp'))
  fs.symlinkSync('/etc/hosts', path.join(f.src, 'main.cpp'))
  assert.throws(() => publication.capture(f.root, f.c), /symlink/)
  fs.unlinkSync(path.join(f.directory, 'candidate.json'))
  fs.symlinkSync('/etc/hosts', path.join(f.directory, 'candidate.json'))
  assert.throws(() => publication.plan(f.directory, f.c, f.options), /symlink/)
})
test('Source edits change candidate identity; unknown/traversing paths are rejected', t => {
  const f = fixture(t)
  fs.writeFileSync(path.join(f.src, 'main.cpp'), 'different fix')
  assert.notEqual(publication.hash(publication.capture(f.root, f.c)), f.p.digest)
  f.c.publish.paths = ['../escape']
  assert.throws(() => publication.capture(f.root, f.c), /Invalid publication file path/)
})
test('Publish creates one draft PR and reuses it on repeat, even after closure', t => {
  const f = fixture(t), mock = github(f.p)
  const first = publisher.publishPlan(f.p, mock.api)
  assert.equal(first.reused, false)
  assert.equal(mock.state.prs[0].draft, true)
  mock.state.prs[0].state = 'closed'
  const second = publisher.publishPlan(f.p, mock.api)
  assert.equal(second.reused, true)
  assert.equal(second.state, 'closed')
  assert.equal(mock.calls.filter(x => x.method === 'POST' && x.endpoint.endsWith('/pulls')).length, 1)
  assert.equal(mock.calls.filter(x => x.method === 'PATCH').length, 0)
})
test('Retry resumes after branch creation and PR request failure', t => {
  const f = fixture(t), mock = github(f.p)
  mock.state.failure = true
  assert.throws(() => publisher.publishPlan(f.p, mock.api), /Temporary failure/)
  mock.state.failure = false
  assert.equal(publisher.publishPlan(f.p, mock.api).reused, false)
  assert.equal(mock.calls.filter(x => x.endpoint.endsWith('/git/refs')).length, 1)
})
test('Conflicting branch is never overwritten', t => {
  const f = fixture(t), mock = github(f.p)
  mock.state.ref = { object: { sha: 'other' } }
  mock.state.commits.other = { tree: { sha: 'other-tree' }, parents: [] }
  assert.throws(() => publisher.publishPlan(f.p, mock.api), /refusing to overwrite/)
  assert.equal(mock.calls.filter(x => x.method === 'PATCH' || x.endpoint.endsWith('/pulls')).length, 0)
})
test('Read failures and unrelated forks cause zero remote writes', t => {
  const f = fixture(t), mock = github(f.p)
  const api = (method, endpoint, body) => endpoint === 'repos/me/project' ? { source: { full_name: 'wrong/repo' }, permissions: { push: true } } : mock.api(method, endpoint, body)
  assert.throws(() => publisher.publishPlan(f.p, api), /fork network/)
  assert.equal(mock.calls.filter(x => x.method === 'POST').length, 0)
  assert.throws(() => publisher.publishPlan(f.p, () => { throw new Error('HTTP 403') }), /403/)
})
test('Hardware kit includes actual owner instructions and preserves filled results', t => {
  const f = fixture(t)
  const text = publication.hardwareKit(f.directory, f.c)
  assert.match(text, /Check actual equipment/)
  assert.match(text, /Simulated only/)
  const result = path.join(f.directory, 'owner-result.json')
  assert.equal(JSON.parse(fs.readFileSync(result)).result, 'NOT_RUN')
  fs.writeFileSync(result, '{"result":"PASS","owner":"operator"}')
  publication.hardwareKit(f.directory, f.c)
  assert.equal(JSON.parse(fs.readFileSync(result)).owner, 'operator')
})
test('Option parser refuses unknown switches and duplicate targets', () => {
  assert.deepEqual(publisher.parseOptions(['--fork', 'me/project', '--dry-run']), { fork: 'me/project', dryRun: true })
  assert.throws(() => publisher.parseOptions(['--force']), /Use --fork/)
  assert.throws(() => publisher.parseOptions(['--fork', 'me/a', '--fork', 'me/b']), /Duplicate/)
})
