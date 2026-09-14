import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2] || 'sources/amical-165'
const started = performance.now()
const run = spawnSync('node', ['cases/amical-165/probe.mjs', source], {
  encoding: 'utf8'
})
process.stdout.write(run.stdout || '')
process.stderr.write(run.stderr || '')
const passed = run.status === 0
const report = {
  hardwareVerified: false,
  applicationVerified: true,
  results: [{
    name: 'Multichannel capture preserves the active microphone input',
    status: passed ? 'PASS' : 'FAIL',
    durationMs: performance.now() - started,
    ...(passed ? {} : { message: `Probe exited ${run.status}` })
  }]
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/amical-165.json', JSON.stringify(report, null, 2) + '\n')
if (!passed) process.exitCode = 1
