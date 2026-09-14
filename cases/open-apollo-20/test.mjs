import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
const started = performance.now()
const run = spawnSync('bash', ['tests/test-install-dependencies.sh'], {
  cwd: source,
  encoding: 'utf8'
})
process.stdout.write(run.stdout || '')
process.stderr.write(run.stderr || '')
const passed = run.status === 0
const report = {
  hardwareVerified: false,
  applicationVerified: true,
  results: [{
    name: 'Debian AppIndicator dependency selection',
    status: passed ? 'PASS' : 'FAIL',
    durationMs: performance.now() - started,
    ...(passed ? {} : { message: `Regression exited ${run.status}` })
  }]
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/open-apollo-20.json', JSON.stringify(report, null, 2) + '\n')
if (!passed) process.exitCode = 1
