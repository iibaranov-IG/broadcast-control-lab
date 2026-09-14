import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const source = path.resolve(process.argv[2] ?? 'sources/uttrflow-555')
const started = performance.now()
const child = spawn(process.execPath, ['cases/uttrflow-555/contract.test.mjs', source], {
  cwd: path.resolve('.'),
  stdio: 'inherit',
})
const code = await new Promise((resolve, reject) => {
  child.on('error', reject)
  child.on('exit', resolve)
})
const report = {
  hardwareVerified: false,
  applicationVerified: false,
  results: [{
    name: 'Permission recovery source contract',
    status: code === 0 ? 'PASS' : 'FAIL',
    durationMs: performance.now() - started,
  }],
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/uttrflow-555.json', `${JSON.stringify(report, null, 2)}\n`)
if (code !== 0) process.exitCode = 1
