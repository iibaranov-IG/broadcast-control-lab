import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2] ?? 'sources/nora-997'
const report = { hardwareVerified: false, applicationVerified: false, results: [] }
mkdirSync('reports/nora-997', { recursive: true })

const started = performance.now()
const child = spawn('node', ['--test', 'bcl_apk_content_type.test.mjs'], {
  cwd: source,
  stdio: 'inherit',
})
const code = await new Promise((resolve, reject) => {
  child.on('error', reject)
  child.on('exit', resolve)
})

report.results.push({
  name: 'APK MIME mapping and AAB fallback source contract',
  status: code === 0 ? 'PASS' : 'FAIL',
  durationMs: performance.now() - started,
})
writeFileSync('reports/nora-997.json', JSON.stringify(report, null, 2) + '\n')
if (code !== 0) process.exitCode = 1
