import test from 'node:test'
import assert from 'node:assert/strict'
import dgram from 'node:dgram'
import { once } from 'node:events'
import { mkdirSync, writeFileSync } from 'node:fs'
import { ScriptedUdpDevice } from '../lib/scripted-udp-device.mjs'

async function setup(t) {
  const device = new ScriptedUdpDevice()
  const endpoint = await device.start()
  const client = dgram.createSocket('udp4')
  await new Promise(resolve => client.bind(0, '127.0.0.1', resolve))
  t.after(async () => { client.close(); await device.stop() })
  const send = data => new Promise((resolve, reject) => client.send(Buffer.from(data), endpoint.port, endpoint.host, e => e ? reject(e) : resolve()))
  return { device, client, send }
}

test('UDP preserves binary datagram boundaries and consumes each once', async t => {
  const { device, send } = await setup(t)
  await send([0, 255]); await send([1, 2, 3])
  assert.deepEqual((await device.receive()).data, Buffer.from([0, 255]))
  assert.deepEqual((await device.receive()).data, Buffer.from([1, 2, 3]))
  await assert.rejects(device.receive({ timeoutMs: 20 }), /Timed out/)
})

test('UDP scenario models a lost reply followed by retry and binary response', async t => {
  const { device, client, send } = await setup(t)
  const scenario = device.run([
    { expect: [0x81, 0x09, 0xff], replies: [] },
    { expect: [0x81, 0x09, 0xff], replies: [{ data: [0x90, 0x50, 0xff], delayMs: 5 }] },
  ])
  const response = once(client, 'message')
  await send([0x81, 0x09, 0xff]); await send([0x81, 0x09, 0xff])
  await scenario
  assert.deepEqual((await response)[0], Buffer.from([0x90, 0x50, 0xff]))
  const report = device.report()
  assert.deepEqual(report.transcript.map(e => e.event), ['client-to-device', 'client-to-device', 'device-to-client'])
  assert.equal(report.hardwareVerified, false)
  mkdirSync('reports', { recursive: true })
  writeFileSync('reports/udp-harness.json', JSON.stringify({ ...report, scenario: 'synthetic retry exchange; not a vendor protocol qualification', result: 'PASS' }, null, 2) + '\n')
})

test('UDP fails on unexpected packets and missing packets', async t => {
  const { device, send } = await setup(t)
  const bad = assert.rejects(device.run([{ expect: [1] }]), /mismatch/)
  await send([2]); await bad
  await assert.rejects(device.run([{ expect: [1] }], { timeoutMs: 20 }), /Timed out/)
})

test('UDP shutdown rejects pending receives and permits restart', async t => {
  const { device } = await setup(t)
  const stopped = assert.rejects(device.receive(), /stopped/)
  await device.stop(); await stopped
  await assert.rejects(device.receive(), /stopped/)
  await device.start()
  assert.deepEqual(device.report().transcript, [])
})
