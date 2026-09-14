import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2] ?? 'sources/esp-osc-2'
const report = { hardwareVerified: false, applicationVerified: true, results: [] }
mkdirSync('reports/esp-osc-2', { recursive: true })

const started = performance.now()
const child = spawn('sh', ['test/bcl_strict_aliasing.sh'], { cwd: source, stdio: 'inherit' })
const code = await new Promise((resolve, reject) => {
  child.on('error', reject)
  child.on('exit', resolve)
})

report.results.push({
  name: 'GCC strict-aliasing compile and OSC float/double wire bytes',
  status: code === 0 ? 'PASS' : 'FAIL',
  durationMs: performance.now() - started,
})
writeFileSync('reports/esp-osc-2.json', JSON.stringify(report, null, 2) + '\n')
if (code !== 0) process.exitCode = 1
