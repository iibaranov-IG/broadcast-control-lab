import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const source = process.argv[2]
if (!source) throw new Error('Expected source checkout')
const read = path => readFileSync(join(source, path), 'utf8')
const checks = [
  ['DeviceMode exposes codecId', read('src/bindings/device.h').includes('AVCodecID codecId')],
  ['MJPG maps to MJPEG codec', read('src/bindings/device_linux.cc').includes('{AV_PIX_FMT_NONE, AV_CODEC_ID_MJPEG}')],
  ['async binding exports codecId', read('src/bindings/device_async.cc').includes('modeObj.Set("codecId"')],
  ['sync binding exports codecId', read('src/bindings/device_sync.cc').includes('modeObj.Set("codecId"')],
  ['TypeScript API returns codecId', read('src/lib/device.ts').includes('codecId: m.codecId')],
]
const report = { hardwareVerified: false, applicationVerified: false, results: checks.map(([name, pass]) => ({ name, status: pass ? 'PASS' : 'FAIL' })) }
mkdirSync('reports', { recursive: true })
writeFileSync('reports/node-av-349.json', JSON.stringify(report, null, 2) + '\n')
if (checks.some(([, pass]) => !pass)) process.exitCode = 1
