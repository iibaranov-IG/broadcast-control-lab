import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const run = spawnSync('.venv/bin/python', ['tests/test_multilens_detection_capabilities.py'], { cwd: source, encoding: 'utf8', env: { ...process.env, PYTHONPATH: '.' } })
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['focused multilens regression exits successfully', run.status === 0],
  ['real unittest executed', output.includes('Ran 1 test')],
  ['focused unittest reports success', output.includes('OK')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(path.join('reports', 'reolink-aio-204.json'), JSON.stringify({ results, output }, null, 2))
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) {
  process.stderr.write(output)
  process.exit(1)
}
