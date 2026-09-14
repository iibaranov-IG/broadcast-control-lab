import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const run = spawnSync('python3', ['../../cases/open-nvr-468/upstream.py'], {
  cwd: source,
  encoding: 'utf8',
})
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['WS-Security regression exits successfully', run.status === 0],
  ['focused suite executes both tests', output.includes('Ran 2 tests')],
  ['focused suite reports success', output.includes('OK')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(path.join('reports', 'open-nvr-468.json'), JSON.stringify({ results, output }, null, 2))
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) {
  process.stderr.write(output)
  process.exit(1)
}
