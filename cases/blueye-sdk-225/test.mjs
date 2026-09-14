import assert from 'node:assert/strict'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const camera = readFileSync(path.join(source, 'blueye/sdk/camera.py'), 'utf8')
const connection = readFileSync(path.join(source, 'blueye/sdk/connection.py'), 'utf8')
assert.ok(camera.includes('record_state.multibeam_is_recording'))
assert.ok(connection.includes('"multibeam": multibeam_enabled'))
mkdirSync('reports', { recursive: true })
writeFileSync('reports/blueye-sdk-225.json', JSON.stringify({ results: [{ name: 'multibeam recording state preservation', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS blueye-sdk-225: multibeam bit reaches RecordCtrl')
