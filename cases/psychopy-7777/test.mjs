import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const source = path.resolve(process.argv[2] ?? 'sources/psychopy-7777')
const report = { hardwareVerified: false, applicationVerified: false, results: [] }
const probe = fileURLToPath(new URL('./probe.py', import.meta.url))
const reports = path.resolve(path.dirname(probe), '../../reports')
mkdirSync(reports, { recursive: true })

const started = performance.now()
const child = spawn('python3', [probe, source], { stdio: 'inherit' })
const code = await new Promise((resolve, reject) => {
  child.on('error', reject)
  child.on('exit', resolve)
})

report.results.push({
  name: 'Generated PsychoJS microphone stop order',
  status: code === 0 ? 'PASS' : 'FAIL',
  durationMs: performance.now() - started,
})
writeFileSync(path.join(reports, 'psychopy-7777.json'), `${JSON.stringify(report, null, 2)}\n`)
if (code !== 0) process.exitCode = 1
