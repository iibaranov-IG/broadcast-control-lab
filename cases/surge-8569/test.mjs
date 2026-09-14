import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
const started = performance.now()
const run = spawnSync(process.execPath, ['--test', 'tests/test_mts_channel_period_bcl.mjs'], {
  cwd: source,
  encoding: 'utf8'
})
process.stdout.write(run.stdout || '')
process.stderr.write(run.stderr || '')
const passed = run.status === 0
const report = {
  hardwareVerified: false,
  applicationVerified: false,
  results: [{
    name: 'MTS channel shift source and regression contract',
    status: passed ? 'PASS' : 'FAIL',
    durationMs: performance.now() - started,
    ...(passed ? {} : { message: `Regression exited ${run.status}` })
  }]
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/surge-8569.json', JSON.stringify(report, null, 2) + '\n')
if (!passed) process.exitCode = 1
