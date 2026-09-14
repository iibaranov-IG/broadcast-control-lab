import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const source = process.argv[2]
const run = spawnSync(
  'python3',
  ['-m', 'unittest', '-v', 'tests/test_osc_bind_address.py'],
  {
    cwd: source,
    encoding: 'utf8',
    env: { ...process.env, PYTHONPATH: '.' },
  },
)
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['focused OSC interface regression exits successfully', run.status === 0],
  ['two UI/server tests executed', output.includes('Ran 2 tests')],
  ['focused unittest reports success', output.includes('OK')],
]
const results = checks.map(([name, ok]) => ({
  name,
  status: ok ? 'PASS' : 'FAIL',
}))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(
  'reports/linux-show-player-398.json',
  JSON.stringify({ results, output }, null, 2) + '\n',
)
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) {
  process.stderr.write(output)
  process.exit(1)
}
