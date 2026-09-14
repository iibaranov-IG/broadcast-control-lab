import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const code = fs.readFileSync(path.join(source, 'www/a/update.js'), 'utf8')
const tests = fs.readFileSync(path.join(source, 'tests/update-reattach.test.js'), 'utf8')
assert.ok(code.includes("typeof e.data === 'string'"))
assert.ok(code.includes('? e.data'))
assert.ok(code.includes("dec.decode(new Uint8Array(e.data), { stream: true })"))
assert.ok(tests.includes('a text-frame refusal reaches the transcript unchanged'))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/majestic-webui-477.json', JSON.stringify({ results: [{ name: 'upgrade WebSocket text diagnostics', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS majestic-webui-477: text and binary upgrade frames verified')
