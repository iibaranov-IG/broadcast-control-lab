import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { run } from '../scripts/upstream-import.cjs'
import { hash } from '../scripts/publication.cjs'
import { attach } from '../scripts/tracking.cjs'
test('external logs bind exact candidate, reject tampering and do not upgrade qualification', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-import-')); t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  const dir = path.join(root, 'reports/example'); fs.mkdirSync(dir, { recursive: true })
  const c = { id: 'example', sources: [{ commit: 'a'.repeat(40) }] }
  fs.writeFileSync(path.join(dir, 'candidate.json'), 'candidate')
  fs.writeFileSync(path.join(dir, 'evidence.json'), JSON.stringify({ qualification: 'CONTRACT_ONLY', publication: { sha256: hash('candidate') }, logs: [] }))
  fs.writeFileSync(path.join(root, 'suite.log'), 'actual output')
  const manifest = { schemaVersion: 1, case: c.id, candidateSha256: hash('candidate'), sources: c.sources, environment: { python: '3.12.14' }, runUrl: 'https://github.com/team/project/actions/runs/1', commands: [{ argv: ['python3', '-m', 'unittest'], cwd: '.', exitCode: 0, durationMs: 23, log: 'suite.log', sha256: hash('actual output') }] }
  const filename = path.join(root, 'manifest.json'); fs.writeFileSync(filename, JSON.stringify(manifest))
  assert.equal(run(root, c, filename).qualification, 'CONTRACT_ONLY')
  fs.writeFileSync(path.join(root, 'suite.log'), 'tampered')
  assert.throws(() => run(root, c, filename), /hash mismatch/)
  manifest.candidateSha256 = 'b'.repeat(64); fs.writeFileSync(filename, JSON.stringify(manifest))
  assert.throws(() => run(root, c, filename), /exact case/)
})
test('attach existing PR validates issue and target, syncs conflict state and remains idempotent', () => {
  const c = { id: 'example', title: 'Repair', issue: 'https://github.com/team/project/issues/1', publish: { target: 'team/project' } }
  const db = { repairs: [] }
  const info = { body: 'Related #1', state: 'open', head: { sha: 'a'.repeat(40) }, base: { repo: { full_name: 'team/project' } }, mergeable: false, mergeable_state: 'dirty' }
  const api = (_, endpoint) => {
    if (endpoint.endsWith('/pulls/2')) return info
    if (endpoint.endsWith('/issues/1')) return { user: { login: 'owner' } }
    if (endpoint.includes('check-runs')) return { check_runs: [] }
    if (endpoint.endsWith('/status')) return { state: 'pending', total_count: 0 }
    return []
  }
  const update = (_, mutate) => { mutate(db); return { updated: true } }
  attach('', c, 'https://github.com/team/project/pull/2', api, update)
  attach('', c, 'https://github.com/team/project/pull/2', api, update)
  assert.equal(db.repairs.length, 1); assert.equal(db.repairs[0].mergeable, false)
  assert.equal(db.repairs[0].evidenceStatus, 'NOT_BOUND')
  info.body = 'unrelated'; assert.throws(() => attach('', c, 'https://github.com/team/project/pull/2', api, update), /explicitly reference/)
  assert.throws(() => attach('', c, 'https://github.com/other/project/pull/2', api, update), /target/)
})
