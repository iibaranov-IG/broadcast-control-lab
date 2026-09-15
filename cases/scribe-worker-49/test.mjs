import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
const report = { hardwareVerified: false, applicationVerified: false, results: [] }
mkdirSync('reports', { recursive: true })
const started = performance.now()
const child = spawn('python3', ['-m', 'unittest', '-v', 'bcl_album_art_test.py'], { cwd: source, stdio: ['ignore', 'pipe', 'pipe'] })
let output = ''
child.stdout.on('data', chunk => { output += chunk })
child.stderr.on('data', chunk => { output += chunk })
const code = await new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve) })
report.results.push({ name: 'Covered MP3 stays audio and produces WAV plus MP4 preview', status: code === 0 && output.includes('Ran 3 tests') ? 'PASS' : 'FAIL', durationMs: performance.now() - started, ...(code === 0 ? {} : { message: output.slice(-4000) }) })
writeFileSync('reports/scribe-worker-49.json', JSON.stringify(report, null, 2) + '\n')
if (report.results.some(result => result.status !== 'PASS')) process.exitCode = 1
