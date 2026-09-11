import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const source = process.argv[2]
assert.ok(source, 'source directory required')
execFileSync('python3', ['-m', 'compileall', '-q', source])
const files = ["tests/test_web_api.py"]
const text = files.filter(p => p.endsWith('.py') || p.endsWith('.md') || p.endsWith('.yml')).map(p => fs.existsSync(`${source}/${p}`) ? fs.readFileSync(`${source}/${p}`, 'utf8') : '').join('\n')
assert.ok(text.includes("response's ScreenFeed.release task owns the stream"), 'missing repaired source contract')
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(path.join('reports', 'c64cast-378.json'), JSON.stringify({ results: [{ name: 'patch, syntax and source contract', status: 'PASS' }] }, null, 2) + '\n')
console.log('PASS c64cast-378: patch and syntax contract verified')
