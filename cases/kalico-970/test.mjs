import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const source = path.resolve(process.argv[2] ?? 'sources/kalico-970')
const report = { hardwareVerified: false, applicationVerified: false, results: [] }
const started = performance.now()
const child = spawn('python3', ['cases/kalico-970/upstream.py', source], {
  cwd: path.resolve('.'),
  stdio: 'inherit',
})
const code = await new Promise((resolve, reject) => {
  child.on('error', reject)
  child.on('exit', resolve)
})
report.results.push({
  name: 'Saved USB product follows a changed MCU architecture',
  status: code === 0 ? 'PASS' : 'FAIL',
  durationMs: performance.now() - started,
})
mkdirSync('reports', { recursive: true })
writeFileSync('reports/kalico-970.json', `${JSON.stringify(report, null, 2)}\n`)
if (code !== 0) process.exitCode = 1
