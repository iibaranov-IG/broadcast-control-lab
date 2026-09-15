import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
if (!source) throw new Error('Expected source checkout')
const report = { hardwareVerified: false, applicationVerified: true, results: [] }
mkdirSync('reports', { recursive: true })
const execute = (argv, env = {}) => new Promise((resolve, reject) => {
  const child = spawn(argv[0], argv.slice(1), { stdio: 'inherit', env: { ...process.env, ...env }, timeout: 10000 })
  child.on('error', reject)
  child.on('exit', code => code === 0 ? resolve() : reject(new Error('Probe exited ' + code)))
})
const started = performance.now()
try {
  await execute(['python3', 'cases/chime-tts-339/test_bcl_issue_339.py', source])
  report.results.push({ name: 'Downloaded external chime survives playback resolution', status: 'PASS' })
} catch (error) {
  report.results.push({ name: 'Downloaded external chime survives playback resolution', status: 'FAIL', message: error.message })
} finally {
  report.results[0].durationMs = performance.now() - started
  writeFileSync('reports/chime-tts-339.json', JSON.stringify(report, null, 2) + '\n')
}
if (report.results.some(r => r.status !== 'PASS')) process.exitCode = 1
