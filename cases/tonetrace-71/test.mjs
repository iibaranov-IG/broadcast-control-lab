import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const source=process.argv[2]
execFileSync('python3',['-m','compileall','-q',source])
const code=fs.readFileSync(`${source}/src/notegrabber/gui/main_window.py`,'utf8')
assert.ok(code.includes('.tonetrace.mid'))
assert.ok(code.includes('export/last_directory'))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(path.join('reports', 'tonetrace-71.json'), JSON.stringify({ results: [{ name: 'patch, syntax and source contract', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS tonetrace-71: export defaults contract verified')
