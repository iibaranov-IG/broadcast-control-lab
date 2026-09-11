import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { load, all, validate, select } = require('../scripts/case.cjs')
const { scaffold } = require('../scripts/bcl.cjs')
test('all five existing cases migrate; diagnostics do not require packages', () => {
  assert.deepEqual(all().map(c => c.id), ['aten-2029', 'autoptz-155', 'intelix', 'tcc2', 'zynthian-1530'])
  assert.equal(load('intelix').sources.length, 2)
  assert.equal(load('autoptz-155').artifacts.package, undefined)
  assert.equal(load('zynthian-1530').verification.applicationVerified, false)
})
test('selection covers case edits, shared changes, removals and documentation', () => {
  const cases = all()
  assert.deepEqual(select(cases, ['cases/autoptz-155/client.py']), ['autoptz-155'])
  assert.deepEqual(select(cases, ['README.md']), [])
  assert.equal(select(cases, ['lib/scripted-udp-device.mjs']).length, 5)
  assert.equal(select(cases, ['scripts/case.cjs']).length, 5)
  assert.equal(select(cases, null).length, 5)
  assert.deepEqual(select(cases, ['cases/deleted-123/test.mjs']), [])
})
test('invalid source aliases and mutable references are rejected', () => {
  const c = load('intelix')
  c.sources[1].directory = c.sources[0].directory
  assert.throws(() => validate(c), /distinct/)
  const d = load('aten-2029')
  d.sources[0].commit = 'main'
  assert.throws(() => validate(d), /immutable/)
})
test('new issue yields a draft with a pinned source, never a claimed repair', () => {
  const c = scaffold('https://github.com/example/control/issues/123', 'a'.repeat(40), 'Cannot connect')
  assert.equal(c.id, 'control-123')
  assert.equal(c.status, 'draft')
  assert.equal(c.verification.hardwareVerified, false)
  assert.equal(c.sources[0].commit, 'a'.repeat(40))
  assert.match(c.acceptance, /TODO/)
  assert.throws(() => scaffold('https://example.com/issue/1', 'a'.repeat(40), 'x'))
})
