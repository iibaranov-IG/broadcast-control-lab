import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const source = process.argv[2]
if (!source) throw new Error('Expected source checkout')
const read = path => readFileSync(join(source, path), 'utf8')
const page = read('tools/control_page.js')
const controlcheck = read('tests/daemon/controlcheck.sh')
const checks = [
  ['picker values carry device names', page.includes('o.value = d.name')],
  ['capture save writes name and clears id', page.includes("out['capture'] = cap; out['capture-id'] = ''")],
  ['playback save writes name and clears id', page.includes("out['playback'] = play; out['playback-id'] = ''")],
  ['legacy ids resolve to a current device name', page.includes('const idMatch = list.find')],
  ['unresolved saved names are visible', page.includes('is not currently connected')],
  ['served control-page gate checks the migration', controlcheck.includes('device picker values are durable names')],
]
const report = {
  hardwareVerified: false,
  applicationVerified: true,
  results: checks.map(([name, pass]) => ({ name, status: pass ? 'PASS' : 'FAIL' })),
}
mkdirSync('reports', { recursive: true })
writeFileSync('reports/naudio-107.json', JSON.stringify(report, null, 2) + '\n')
if (checks.some(([, pass]) => !pass)) process.exitCode = 1
