import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const source = process.argv[2]
const run = spawnSync('python3', ['tests/test_fov_default_space.py'], { cwd: source, encoding: 'utf8' })
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['FOV default-space regression exits successfully', run.status === 0],
  ['selector and five templates are covered', output.includes('Ran 3 tests')],
  ['focused suite reports success', output.includes('OK')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/thingino-firmware-1655.json', JSON.stringify({ results, output }, null, 2))
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) process.exit(1)
