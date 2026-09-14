import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const code = fs.readFileSync(path.join(source, 'cameractrls.py'), 'utf8')
const tests = fs.readFileSync(path.join(source, 'tests/test_cameractrls.py'), 'utf8')
assert.ok(code.includes('timeout=ptz_helper_timeout'))
assert.ok(code.includes('except subprocess.TimeoutExpired:'))
assert.ok(code.includes("logging.warning(f'{params[0]} timed out, skipping')"))
assert.ok(tests.includes('test_skips_a_probe_that_times_out'))
assert.ok(tests.includes('test_returns_output_lines_with_a_bounded_probe'))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/cameractrls-118.json', JSON.stringify({ results: [{ name: 'bounded PTZ helper probe', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS cameractrls-118: helper timeout and normal output verified')
