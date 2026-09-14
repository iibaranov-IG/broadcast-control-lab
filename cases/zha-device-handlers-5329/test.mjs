import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const quirkPath = path.join(source, 'zhaquirks/hobeian/zg_305z.py')
const testPath = path.join(source, 'tests/test_hobeian.py')
const quirk = fs.existsSync(quirkPath) ? fs.readFileSync(quirkPath, 'utf8') : ''
const test = fs.existsSync(testPath) ? fs.readFileSync(testPath, 'utf8') : ''

const checks = [
  ['quirk matches the reported manufacturer and model', quirk.includes('QuirkBuilder("HOBEIAN", "ZG-305Z")')],
  ['endpoint 1 becomes an on/off output', quirk.includes('.replaces_endpoint(1, device_type=zha.DeviceType.ON_OFF_OUTPUT)')],
  ['endpoint 2 becomes an on/off output', quirk.includes('.replaces_endpoint(2, device_type=zha.DeviceType.ON_OFF_OUTPUT)')],
  ['quirk is registered', quirk.includes('.add_to_registry()')],
  ['regression covers both physical outputs', test.includes('assert device[1].device_type') && test.includes('assert device[2].device_type')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync(
  'reports/zha-device-handlers-5329.json',
  JSON.stringify({ results }, null, 2) + '\n',
)
for (const result of results) console.log(`${result.status}: ${result.name}`)
if (results.some(result => result.status !== 'PASS')) process.exit(1)
