import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const run = spawnSync('python', ['-m', 'unittest', 'discover', '-s', 'tests', '-p', 'test_device_levels.py', '-v'], { cwd: source, encoding: 'utf8' })
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['focused device-state suite exits successfully', run.status === 0],
  ['three state regressions execute', output.includes('Ran 3 tests')],
  ['focused unittest reports success', output.includes('OK')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(path.join('reports', 'pipewirecontroller-19.json'), JSON.stringify({ hardwareVerified: false, applicationVerified: false, results, output }, null, 2) + '\n')
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) {
  process.stderr.write(output)
  process.exit(1)
}
