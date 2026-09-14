import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2] ?? 'sources/reolink-native-linux-7'
const report = { hardwareVerified: false, applicationVerified: false, results: [] }
mkdirSync('reports/reolink-native-linux-7', { recursive: true })

const started = performance.now()
const child = spawn('node', ['--test', 'bcl_device_kind.test.mjs'], {
  cwd: source,
  stdio: 'inherit',
})
const code = await new Promise((resolve, reject) => {
  child.on('error', reject)
  child.on('exit', resolve)
})

report.results.push({
  name: 'successful probes classify both NVRs and standalone cameras',
  status: code === 0 ? 'PASS' : 'FAIL',
  durationMs: performance.now() - started,
})
writeFileSync('reports/reolink-native-linux-7.json', JSON.stringify(report, null, 2) + '\n')
if (code !== 0) process.exitCode = 1
