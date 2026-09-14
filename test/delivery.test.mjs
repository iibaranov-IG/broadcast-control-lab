import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const delivery = require('../scripts/delivery.cjs')

const fixture = () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-delivery-'))
  return { root, c: { id: 'audio-12', title: 'Restore playback', issue: 'https://github.com/a/b/issues/12', ownerCheck: { procedure: 'Press Play.', expected: 'Playback starts.' } } }
}

test('delivery options require exactly one safe method', () => {
  assert.deepEqual(delivery.options(['--command', 'npm start']), { artifact: null, url: null, command: 'npm start' })
  assert.throws(() => delivery.options([]), /exactly one/)
  assert.throws(() => delivery.options(['--url', 'http://example.test']), /HTTPS/)
  assert.throws(() => delivery.options(['--command', 'one', '--command', 'two']), /Duplicate/)
})

test('artifact delivery copies and hashes the exact file', async () => {
  const f = fixture(), artifact = path.join(f.root, 'build.zip')
  fs.writeFileSync(artifact, 'verified build')
  const result = await delivery.create(f.root, f.c, delivery.options(['--artifact', artifact]))
  const manifest = JSON.parse(fs.readFileSync(result.manifest))
  assert.equal(manifest.method.kind, 'artifact')
  assert.equal(manifest.method.size, 14)
  assert.match(manifest.method.sha256, /^[a-f0-9]{64}$/)
  assert.equal(fs.readFileSync(path.join(result.directory, 'build.zip'), 'utf8'), 'verified build')
  assert.match(fs.readFileSync(result.instructions, 'utf8'), /Press Play/)
})

test('URL delivery refuses a failed availability check', async () => {
  const f = fixture()
  await assert.rejects(delivery.create(f.root, f.c, delivery.options(['--url', 'https://example.test/build']), async () => ({ ok: false, status: 404 })), /HTTP 404/)
  assert.equal(fs.existsSync(path.join(f.root, 'reports/audio-12/delivery/delivery.json')), false)
})

test('URL delivery records the resolved reachable URL', async () => {
  const f = fixture()
  const result = await delivery.create(f.root, f.c, delivery.options(['--url', 'https://example.test/build']), async () => ({ ok: true, status: 200, url: 'https://cdn.example.test/build.zip', headers: { get: key => key === 'content-length' ? '42' : 'application/zip' } }))
  const manifest = JSON.parse(fs.readFileSync(result.manifest))
  assert.equal(manifest.method.probe.finalUrl, 'https://cdn.example.test/build.zip')
  assert.equal(manifest.method.probe.contentLength, 42)
})
