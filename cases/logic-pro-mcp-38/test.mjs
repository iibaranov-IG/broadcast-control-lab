import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

const source = process.argv[2]
if (!source) throw new Error('Expected source checkout')
const run = spawnSync(process.execPath, [join(import.meta.dirname, 'test_bcl_issue_38.mjs')], { cwd: source, encoding: 'utf8' })
process.stdout.write(run.stdout || '')
process.stderr.write(run.stderr || '')
const lines = `${run.stdout || ''}\n${run.stderr || ''}`.split('\n').filter(Boolean)
const results = lines.filter(line => /^(PASS|FAIL): /.test(line)).map(line => ({
  name: line.replace(/^(PASS|FAIL): /, ''),
  status: line.startsWith('PASS:') ? 'PASS' : 'FAIL',
}))
mkdirSync('reports', { recursive: true })
writeFileSync('reports/logic-pro-mcp-38.json', JSON.stringify({ hardwareVerified: false, applicationVerified: false, results }, null, 2) + '\n')
if (run.status !== 0 || results.some(result => result.status !== 'PASS')) process.exitCode = 1
