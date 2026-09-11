import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import assert from 'node:assert/strict'
import { ScriptedUdpDevice } from '../../lib/scripted-udp-device.mjs'

const source = path.resolve(process.argv[2] || 'sources/autoptz')
const report = { issue: 'https://github.com/AutoPTZ/autoptz/issues/155',
  revision: '39d8ebab461d86e8e06a683905829d21acec7adc',
  evidence: 'actual Python PTZ backend against BCL loopback UDP socket', hardwareVerified: false, results: [] }
const bytes = hex => Buffer.from(hex, 'hex')
async function check(name, mode, action, steps, expected) {
  const started = performance.now()
  const device = new ScriptedUdpDevice()
  let child
  try {
    const { port } = await device.start()
    child = spawn('python3', ['cases/autoptz-155/client.py', source, String(port), mode, action])
    let stdout = '', stderr = ''
    child.stdout.on('data', x => { stdout += x })
    child.stderr.on('data', x => { stderr += x })
    const completed = new Promise((resolve, reject) => {
      child.on('error', reject)
      child.on('close', code => code === 0 ? resolve() : reject(new Error(stderr || `Python exit ${code}`)))
    })
    await Promise.all([device.run(steps), completed])
    assert.deepEqual(JSON.parse(stdout).result, expected)
    report.results.push({ name, status: 'PASS', durationMs: performance.now() - started, transcript: device.report().transcript })
  } catch (error) {
    report.results.push({ name, status: 'FAIL', durationMs: performance.now() - started, message: error.message, transcript: device.report().transcript })
  } finally {
    child?.kill()
    await device.stop()
  }
}
await check('Raw UDP sends separate pan/tilt and zoom stop datagrams', 'raw', 'stop', [
  { expect: bytes('8101060115150303ff') }, { expect: bytes('8101040700ff') },
], 'sent')
const request = bytes('010000050000000181090447ff')
await check('Sony query reads header and payload from one UDP datagram', 'sony', 'query', [
  { expect: request, replies: [{ data: bytes('0111000700000001905000010203ff') }] },
], '905000010203ff')
await check('Short Sony response returns no position data', 'sony', 'query', [
  { expect: request, replies: [{ data: bytes('01110007') }] },
], null)
await check('Silent camera produces a bounded timeout', 'sony', 'query', [{ expect: request }], null)
mkdirSync('reports', { recursive: true })
writeFileSync('reports/autoptz-155.json', JSON.stringify(report, null, 2) + '\n')
for (const r of report.results) console.log(`${r.status}: ${r.name}${r.message ? ': ' + r.message : ''}`)
if (report.results.some(r => r.status === 'FAIL')) process.exitCode = 1
