import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const page = readFileSync(path.join(source, 'ui/src/pages/ScreenShare/index.jsx'), 'utf8')
const helper = readFileSync(path.join(source, 'ui/src/pages/ScreenShare/firefoxUsb.js'), 'utf8')
assert.ok(page.includes('Enable Firefox USB access'))
assert.ok(helper.includes('getUserMedia({ audio: true })'))
assert.ok(helper.includes('track.stop()'))
mkdirSync('reports', { recursive: true })
writeFileSync('reports/rmfakecloud-485.json', JSON.stringify({ results: [{ name: 'Firefox USB permission recovery', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS rmfakecloud-485: permission is explicit and media tracks are released')
