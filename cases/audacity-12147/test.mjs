import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2] || 'sources/audacity-12147'
const started = performance.now()
const run = spawnSync(process.execPath, ['../../cases/audacity-12147/upstream.mjs'], {
  cwd: source,
  encoding: 'utf8',
  timeout: 30_000,
})
process.stdout.write(run.stdout || '')
process.stderr.write(run.stderr || '')
const report = {
  hardwareVerified: false,
  applicationVerified: false,
  results: [{
    name: 'Audacity playback seek action contract',
    status: run.status === 0 ? 'PASS' : 'FAIL',
    durationMs: Math.round(performance.now() - started),
    message: run.status === 0
      ? 'Four configurable active-playback seek actions are registered, bounded, and covered by controller tests.'
      : `Contract exited ${run.status}`,
  }],
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/audacity-12147.json', JSON.stringify(report, null, 2) + '\n')
if (run.status !== 0) process.exitCode = 1
