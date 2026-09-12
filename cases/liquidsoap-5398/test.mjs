import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
const source = process.argv[2]
const file = fs.readFileSync(path.join(source, 'src/libs/extra/audioscrobbler.liq'), 'utf8')
assert.ok(file.includes('~base_url="https://ws.audioscrobbler.com/2.0"'), 'Last.fm default must use HTTPS')
assert.ok(!file.includes('~base_url="http://ws.audioscrobbler.com/2.0"'), 'insecure default must be removed')
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/liquidsoap-5398.json', JSON.stringify({ results: [{ name: 'secure Audioscrobbler default', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS liquidsoap-5398: Last.fm requests default to HTTPS')
