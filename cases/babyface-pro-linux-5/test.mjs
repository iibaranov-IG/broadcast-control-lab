import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
if (!source) throw new Error('source directory required')
const started = performance.now()
const result = spawnSync('python3', ['-m', 'unittest', '-v', 'tests/bcl/test_stream_restart.py'], {
  cwd: source, encoding: 'utf8', env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' },
})
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
const passed = result.status === 0
mkdirSync('reports', { recursive: true })
writeFileSync('reports/babyface-pro-linux-5.json', JSON.stringify({
  hardwareVerified: false, applicationVerified: false,
  results: [{ name: 'coalesced STOP/START stream lifecycle', status: passed ? 'PASS' : 'FAIL', durationMs: Math.round(performance.now() - started) }],
}, null, 2) + '\n')
if (!passed) process.exit(result.status || 1)
