import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
const source = path.resolve(process.argv[2] || 'sources/transcripted-1734')
const result = { issue: 'https://github.com/r3dbars/transcripted/issues/1734', revision: '6c85575631cfe942e040f22fa57cad28abcb3a95', hardwareVerified: false, results: [] }
try {
  const output = execFileSync('node', ['cases/transcripted-1734/probe.mjs', source], { encoding: 'utf8' })
  result.results.push({ name: 'asynchronous USB input binding contract', status: 'PASS', output })
} catch (error) {
  result.results.push({ name: 'asynchronous USB input binding contract', status: 'FAIL', output: String(error.stdout || error.message) })
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/transcripted-1734.json', JSON.stringify(result, null, 2) + '\n')
for (const item of result.results) console.log(`${item.status}: ${item.name}`)
if (result.results.some(item => item.status === 'FAIL')) process.exitCode = 1
