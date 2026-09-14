import fs from 'node:fs'
import path from 'node:path'

const root = process.argv[2]
const file = path.join(root, 'src/uac2-driver/CircuitCommon.cpp')
const source = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
const physicalStart = source.indexOf('NTSTATUS Codec_AddAudioJackToBridgePin(')
const dummyStart = source.indexOf('NTSTATUS Codec_AddAudioDummyJackToBridgePin(')
const nextFunction = source.indexOf('static NTSTATUS AllocateElementContext(', dummyStart)
const physical = source.slice(physicalStart, dummyStart)
const dummy = source.slice(dummyStart, nextFunction)

const checks = [
  ['no-control endpoints are static', /jackCfg\.Flags = AcxJackConfigNoFlags;/.test(dummy)],
  ['no-control endpoints do not advertise detection', !/AcxJackConfigJackDetection/.test(dummy)],
  ['no-control endpoints omit the presence callback', !/EvtAcxJackRetrievePresenceState/.test(dummy)],
  ['physical jacks retain presence detection', /jackCfg\.Flags = AcxJackConfigJackDetection;/.test(physical)],
  ['physical jacks retain the presence callback', /EvtAcxJackRetrievePresenceState = EvtJackRetrievePresence;/.test(physical)],
  ['static endpoint remains connected', /jackContext->IsConnected = TRUE;/.test(dummy)],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/low-latency-audio-36.json', JSON.stringify({ results }, null, 2) + '\n')
for (const result of results) console.log(`${result.status}: ${result.name}`)
if (results.some(result => result.status !== 'PASS')) process.exit(1)
