import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const source = process.argv[2]
const run = spawnSync(
  'python3',
  ['-m', 'unittest', '-v', 'tests/test_jack_sink_routing.py'],
  {
    cwd: source,
    encoding: 'utf8',
    env: { ...process.env, PYTHONPATH: '.' },
  },
)
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['focused JACK routing regression exits successfully', run.status === 0],
  ['three routing tests executed', output.includes('Ran 3 tests')],
  ['focused unittest reports success', output.includes('OK')],
]
const results = checks.map(([name, ok]) => ({
  name,
  status: ok ? 'PASS' : 'FAIL',
}))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(
  'reports/linux-show-player-399.json',
  JSON.stringify({ results, output }, null, 2) + '\n',
)
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) {
  process.stderr.write(output)
  process.exit(1)
}
