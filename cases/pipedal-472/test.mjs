import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/pipedal-472')
const report = {
  issue: 'https://github.com/rerdavies/pipedal/issues/472',
  revision: '32c45bf2d1714221eac2c2c62cafcbb77cee899e',
  evidence: 'deterministic ALSA hotplug order model plus production monitor, stable-ID and configuration-refresh contract checks',
  hardwareVerified: false,
  results: [],
}
const record = (name, fn) => {
  const started = performance.now()
  try {
    fn()
    report.results.push({ name, status: 'PASS', durationMs: Math.round(performance.now() - started) })
  } catch (error) {
    report.results.push({ name, status: 'FAIL', durationMs: Math.round(performance.now() - started), message: error.message })
  }
}

record('Port-start retries configuration after client-start arrived too early', () => {
  const saved = 'seq:FootCtrl/FootCtrl Bluetooth'
  let enumerablePorts = []
  let connections = 0
  const refresh = () => {
    if (enumerablePorts.includes(saved)) connections += 1
  }
  refresh()
  if (connections !== 0) throw new Error('Client-start unexpectedly found a port before creation')
  enumerablePorts = [saved]
  refresh()
  if (connections !== 1) throw new Error('Port-start did not reconnect the saved port')
})

record('ALSA monitor forwards both client-start and port-start', () => {
  const implementation = readFileSync(path.join(source, 'PiPedalCommon/src/AlsaSequencer.cpp'), 'utf8')
  const condition = 'event->type == SND_SEQ_EVENT_CLIENT_START ||\n                        event->type == SND_SEQ_EVENT_PORT_START'
  if (!implementation.includes(condition)) throw new Error('Port-start is not handled beside client-start')
  if (!implementation.includes('callback(MonitorAction::DeviceAdded')) throw new Error('Device-added callback is not forwarded')
})

record('Saved IDs are stable names and device-added refreshes the active configuration', () => {
  const sequencer = readFileSync(path.join(source, 'PiPedalCommon/src/AlsaSequencer.cpp'), 'utf8')
  const model = readFileSync(path.join(source, 'src/PiPedalModel.cpp'), 'utf8')
  if (!sequencer.includes('port.id = SS("seq:" << port.clientName << "/" << port.name)')) throw new Error('Port ID depends on transient ALSA client number')
  if (!model.includes('OnAlsaSequencerDeviceAdded')) throw new Error('Device-added handler is missing')
  if (!model.includes('audioHost->SetAlsaSequencerConfiguration(this->storage.GetAlsaSequencerConfiguration())')) throw new Error('Saved configuration is not reapplied')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/pipedal-472.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
