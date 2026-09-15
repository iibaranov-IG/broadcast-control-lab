import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
const started = performance.now()
const result = spawnSync('node', ['../../cases/rtpengine-2172/verify.mjs', '--suite'], { cwd: source, encoding: 'utf8' })
const output = `${result.stdout || ''}${result.stderr || ''}`
const passed = result.status === 0 && output.includes('# TOTAL: 4') && output.includes('# PASS: 4')
const report = { hardwareVerified: false, applicationVerified: false, results: [{ name: 'Opus option and nested hash tables remain distinct', status: passed ? 'PASS' : 'FAIL', durationMs: performance.now() - started, ...(passed ? {} : { message: output.slice(-4000) }) }] }
mkdirSync('reports', { recursive: true })
writeFileSync('reports/rtpengine-2172.json', JSON.stringify(report, null, 2) + '\n')
if (!passed) process.exitCode = 1
