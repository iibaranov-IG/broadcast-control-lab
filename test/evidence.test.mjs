import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { createHash } from 'node:crypto'
import evidence from '../scripts/evidence.cjs'
test('Evidence hashes package bytes and preserves a failed stage', t => {
  const root = mkdtempSync(path.join(tmpdir(), 'bcl-evidence-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(path.join(root, 'build'))
  writeFileSync(path.join(root, 'build', 'candidate.tgz'), 'abc')
  const files = evidence.packages(root, 'build/*.tgz')
  assert.equal(files[0].sha256, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  assert.throws(() => evidence.packages(root, 'build/*.zip'), /no matching/)
  symlinkSync(path.join(root, 'build/candidate.tgz'), path.join(root, 'build/link.tgz'))
  assert.throws(() => evidence.packages(root, 'build/link.tgz'), /regular file/)
  const passport = { id: 'example', title: 'Example', source: {}, verification: { hardwareVerified: false, limitations: 'Synthetic', ownerCheck: 'Check hardware' } }
  evidence.writeEvidence(root, passport, { status: 'FAIL', stages: [{ name: 'test', status: 'FAIL' }], error: 'Mismatch', packages: files })
  const report = JSON.parse(readFileSync(path.join(root, 'reports/example/evidence.json')))
  assert.equal(report.status, 'FAIL')
  assert.equal(report.verification.hardwareVerified, false)
  assert.match(readFileSync(path.join(root, 'reports/example/PR-REPORT.md'), 'utf8'), /Mismatch/)
})

test('evidence retains and hashes exact exchange logs with generic application status', t => {
  const root = mkdtempSync(path.join(tmpdir(), 'bcl-exchange-'))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  mkdirSync(path.join(root, 'reports'))
  const raw = JSON.stringify({ results: [{ name: 'datagram', status: 'PASS', durationMs: 2, transcript: [{ hex: '00ff', bytes: 2 }] }] })
  writeFileSync(path.join(root, 'reports/raw.json'), raw)
  const passport = { id: 'example', title: 'Example', sources: [], artifacts: { report: 'reports/raw.json' }, verification: { hardwareVerified: false, applicationVerified: false, limitations: 'Synthetic', ownerCheck: 'Check hardware' } }
  const report = evidence.writeEvidence(root, passport, { status: 'PASS', stages: [], durationMs: 2 })
  assert.equal(report.logs.length, 2)
  for (const log of report.logs) {
    const bytes = readFileSync(path.join(root, 'reports/example', log.path))
    assert.equal(log.sha256, createHash('sha256').update(bytes).digest('hex'))
  }
  assert.equal(report.verification.applicationVerified, false)
})
