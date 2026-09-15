import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const source = path.resolve(process.argv[2] || 'sources/openterface-642')
const header = readFileSync(path.join(source, 'serial/ch9329.h'), 'utf8')
const manager = readFileSync(path.join(source, 'serial/SerialPortManager.cpp'), 'utf8')
const strategy = readFileSync(path.join(source, 'serial/chipstrategy/CH9329Strategy.cpp'), 'utf8')
const diagnostics = readFileSync(path.join(source, 'ui/advance/diagnostics/diagnosticsmanager.cpp'), 'utf8')
const result = { issue: 'https://github.com/TechxArtisanStudio/Openterface_QT/issues/642', revision: '7be8db841fe8ffa27e8adcbbcd654230846994c1', hardwareVerified: false, results: [] }

function check(name, test, detail) {
  result.results.push({ name, status: test ? 'PASS' : 'FAIL', output: detail })
}

for (const name of ['CMD_SET_PARA_CFG_PREFIX_9600', 'CMD_SET_PARA_CFG_PREFIX_115200']) {
  const match = header.match(new RegExp(`${name} = QByteArray::fromHex\\("([^"]+)`))
  const bytes = match ? match[1].trim().split(/\s+/).map(value => Number.parseInt(value, 16)) : []
  check(`${name} uses writable protocol mode`, bytes[6] === 0x00,
    bytes.length ? `serial mode byte: 0x${bytes[6].toString(16).padStart(2, '0')}` : 'constant not found')
}

check('response validator checks success and checksum',
  header.includes('isSuccessfulCH9329Response')
    && header.includes('response[5]) != DEF_CMD_SUCCESS')
    && header.includes('checksum == static_cast<uint8_t>(response.back())'),
  'SET_PARA_CFG must be acknowledged by the matching successful response')
check('menu path stops after a rejected configuration',
  manager.includes('if (!isSuccessfulCH9329Response(configResponse')
    && manager.includes('CH9329 rejected the baudrate configuration'),
  'no reset or local baud switch may follow a rejected SET_PARA_CFG')
check('strategy and diagnostics share response validation',
  strategy.includes('isSuccessfulCH9329Response(response')
    && strategy.includes('isSuccessfulCH9329Response(resetResponse')
    && diagnostics.includes('isSuccessfulCH9329Response(configResponse'),
  'all three CH9329 configuration paths validate device responses')

mkdirSync('reports', { recursive: true })
writeFileSync('reports/openterface-642.json', JSON.stringify(result, null, 2) + '\n')
for (const item of result.results) console.log(`${item.status}: ${item.name} - ${item.output}`)
if (result.results.some(item => item.status === 'FAIL')) process.exitCode = 1
