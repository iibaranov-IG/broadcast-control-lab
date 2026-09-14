import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const run = spawnSync('node', ['../../cases/noisy-studio-99/probe.mjs', 'focused'], {
  cwd: source,
  encoding: 'utf8',
  env: { ...process.env, NODE_OPTIONS: '--localstorage-file=/tmp/noisy-vitest-localstorage.json' },
})
const output = `${run.stdout || ''}${run.stderr || ''}`
const checks = [
  ['focused Python and Vue regressions exit successfully', run.status === 0],
  ['native boundary marker is present', output.includes('PASS: native desktop audio boundary')],
  ['Electron identifies its daemon as native', fs.readFileSync(path.join(source, 'desktop/main.js'), 'utf8').includes('NOISY_CODING_NATIVE_APP: "1"')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/noisy-studio-99.json', JSON.stringify({ results, output }, null, 2) + '\n')
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) process.exit(1)
