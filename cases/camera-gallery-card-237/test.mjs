import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const run = spawnSync('node', ['cases/camera-gallery-card-237/probe.mjs', source], {
  encoding: 'utf8',
})
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['focused live-config suite exits successfully', run.status === 0],
  ['all focused tests execute', output.includes('# tests 50')],
  ['unavailable camera regression passes', output.includes('PASS: unavailable and unknown cameras remain selectable')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(path.join('reports', 'camera-gallery-card-237.json'), JSON.stringify({ results, output }, null, 2) + '\n')
if (run.status !== 0 || results.some((result) => result.status !== 'PASS')) {
  process.stderr.write(output)
  process.exit(1)
}
