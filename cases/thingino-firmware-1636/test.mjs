import fs from 'node:fs'
import path from 'node:path'

const firmware = process.argv[2]
const prudynt = process.argv[3]
const expected = '354b1b4bde4aa67860021531b85549d88ee1717c'
const read = (...parts) => fs.readFileSync(path.join(...parts), 'utf8')

const packageFile = read(firmware, 'package/prudynt-t/prudynt-t.mk')
const http = read(prudynt, 'src/network/HTTPMJPEG.cpp')
const worker = read(prudynt, 'src/video/VideoWorker.cpp')
const channel = read(prudynt, 'src/stream/MsgChannel.hpp')
const pool = read(prudynt, 'src/stream/nalu_pool.hpp')

const checks = [
  ['firmware ships the fMP4 cleanup revision', new RegExp(`^PRUDYNT_T_VERSION = ${expected}$`, 'm').test(packageFile)],
  ['last fMP4 client releases its worker claim', /release_stream_client\(vch, with_audio\)/.test(http) && /hasDataCallback\.store\(false/.test(http)],
  ['idle main channel is not filled without a consumer', /main_consumer\s*=\s*\(global_video\[encChn\]->onDataCallback != nullptr\)/.test(worker) && /if \(!main_consumer\)\s*\{\s*video_state->nalu_pool->returnBuf/.test(worker)],
  ['fMP4 moves queued frames and returns their storage', /read_move\(&unit\)/.test(http) && /q->release\(unit\)/.test(http) && /read_move\(&af\)/.test(http) && /aq->release\(af\)/.test(http)],
  ['message channel recycles queued buffers on destruction', /~MsgChannel\(\)/.test(channel) && /for \(auto &elem : msg_buffer\)/.test(channel) && /recycle\(elem\)/.test(channel)],
  ['NAL pool bounds retained capacity', /maxPoolBytes/.test(pool) && /pooled_bytes \+ cap > maxPoolBytes/.test(pool)],
]

const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/thingino-firmware-1636.json', JSON.stringify({
  hardwareVerified: false,
  applicationVerified: false,
  externalHardwareEvidence: {
    source: 'themactep/prudynt-t@354b1b4bde4aa67860021531b85549d88ee1717c',
    result: 'Heap held around 6 MB across ten fMP4 sessions with no OOM over 50 minutes on the affected device.'
  },
  results
}, null, 2) + '\n')

for (const result of results) console.log(`${result.status}: ${result.name}`)
if (results.some(result => result.status !== 'PASS')) process.exit(1)
