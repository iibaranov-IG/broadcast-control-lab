import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import dgram from 'node:dgram'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { ScriptedUdpDevice } from '../../lib/scripted-udp-device.mjs'

const source = path.resolve(process.argv[2] || 'sources/midimonster-150')
const report = {
  issue: 'https://github.com/cbdevnet/midimonster/issues/150',
  revision: 'c247b034e6e06850af8e58a6ba4adf85c0a18071',
  evidence: 'real MIDIMonster core and OSC backend against BCL loopback UDP sockets',
  hardwareVerified: false,
  results: [],
}
const align = (value) => Buffer.concat([Buffer.from(value + '\0'), Buffer.alloc((4 - ((value.length + 1) % 4)) % 4)])
const message = (address, type, value) => {
  const payload = Buffer.alloc(type === 'f' ? 4 : 0)
  if (type === 'f') payload.writeFloatBE(value)
  return Buffer.concat([align(address), align(',' + type), payload])
}
const availablePort = async () => {
  const socket = dgram.createSocket('udp4')
  await new Promise((resolve, reject) => { socket.once('error', reject); socket.bind(0, '127.0.0.1', resolve) })
  const port = socket.address().port
  await new Promise(resolve => socket.close(resolve))
  return port
}
const send = (socket, packet, port) => new Promise((resolve, reject) => socket.send(packet, port, '127.0.0.1', error => error ? reject(error) : resolve()))
const record = async (name, fn) => {
  const started = performance.now()
  try {
    await fn()
    report.results.push({ name, status: 'PASS', durationMs: Math.round(performance.now() - started) })
  } catch (error) {
    report.results.push({ name, status: 'FAIL', durationMs: Math.round(performance.now() - started), message: error.message })
  }
}

const mixer = new ScriptedUdpDevice()
const sender = dgram.createSocket('udp4')
let child
try {
  const { port: mixerPort } = await mixer.start()
  const triggerPort = await availablePort()
  const config = path.join(tmpdir(), `bcl-midimonster-${process.pid}.cfg`)
  writeFileSync(config, `[backend osc]\ndetect = on\n\n[osc trigger]\nbind = 127.0.0.1 ${triggerPort}\n/send = f 0.0 1.0\n/value = f 0.0 1.0\n\n[osc mixer]\nbind = 127.0.0.1 0\ndestination = 127.0.0.1 ${mixerPort}\n/ch/01/mix/fader = query\n/ch/01/mix/on = f 0.0 1.0\n\n[map]\ntrigger./send > mixer./ch/01/mix/fader\ntrigger./value > mixer./ch/01/mix/on\n`)
  child = spawn(path.join(source, 'midimonster'), [config], { cwd: source })
  let logs = ''
  child.stdout.on('data', chunk => { logs += chunk })
  child.stderr.on('data', chunk => { logs += chunk })
  await Promise.race([
    new Promise((resolve, reject) => {
      const poll = setInterval(() => {
        if (logs.includes('Routing 2 sources')) { clearInterval(poll); resolve() }
        else if (child.exitCode !== null) { clearInterval(poll); reject(new Error(`MIDIMonster exited ${child.exitCode}: ${logs}`)) }
      }, 20)
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error(`MIDIMonster startup timeout: ${logs}`)), 3000)),
  ])

  const query = Buffer.concat([align('/ch/01/mix/fader'), align(',')])
  const float = message('/ch/01/mix/on', 'f', 0.5)
  const checkPacket = async (name, trigger, expected) => record(name, async () => {
    const received = mixer.run([{ expect: expected }])
    await send(sender, trigger, triggerPort)
    await received
  })
  await checkPacket('Query emits an empty OSC type tag and no argument bytes', message('/send', 'f', 1), query)
  await checkPacket('A later trigger emits the same value-less query again', message('/send', 'f', 0.5), query)
  await checkPacket('Ordinary float output keeps its prior wire format', message('/value', 'f', 0.5), float)
  report.transcript = mixer.report().transcript
} catch (error) {
  report.results.push({ name: 'MIDIMonster integration scenario', status: 'FAIL', durationMs: 0, message: error.message, transcript: mixer.report().transcript })
} finally {
  child?.kill('SIGINT')
  sender.close()
  await mixer.stop()
}

mkdirSync('reports', { recursive: true })
writeFileSync('reports/midimonster-150.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
