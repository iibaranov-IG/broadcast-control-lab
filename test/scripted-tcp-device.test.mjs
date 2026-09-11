import assert from 'node:assert/strict'
import net from 'node:net'
import test from 'node:test'
import { once } from 'node:events'

import { ScriptedTcpDevice } from '../lib/scripted-tcp-device.mjs'

test('fragments prompts, records traffic, and redacts secrets', async t => {
  const device = new ScriptedTcpDevice({ redact: ['lab-password'] })
  const endpoint = await device.start()
  t.after(() => device.stop())

  const client = net.createConnection(endpoint)
  t.after(() => client.destroy())
  await once(client, 'connect')
  await device.waitForConnection()

  let received = ''
  client.on('data', data => { received += data.toString('utf8') })
  const promptReceived = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Prompt was not received')), 1000)
    client.on('data', () => {
      if (received.includes('Username: ')) {
        clearTimeout(timer)
        resolve()
      }
    })
  })

  await device.sendChunks(['User', 'name', ': '], { delayMs: 2 })
  await promptReceived
  assert.equal(received, 'Username: ')

  client.write('lab-user lab-password\r\n')
  await device.waitForData('lab-user lab-password\r\n')

  const report = device.report({ caseId: 'HARNESS-001' })
  assert.equal(report.hardwareVerified, false)
  assert.equal(report.caseId, 'HARNESS-001')
  assert.equal(report.transcript.filter(entry => entry.event === 'device-to-client').length, 3)
  assert.equal(report.transcript.at(-1).text, 'lab-user [REDACTED]\r\n')
})

test('disconnects a client and accepts a replacement connection', async t => {
  const device = new ScriptedTcpDevice()
  const endpoint = await device.start()
  t.after(() => device.stop())

  const first = net.createConnection(endpoint)
  await once(first, 'connect')
  await device.waitForConnection()
  const firstClosed = once(first, 'close')
  device.disconnect()
  await firstClosed

  const second = net.createConnection(endpoint)
  t.after(() => second.destroy())
  await once(second, 'connect')
  await device.waitForConnection()
  const secondData = once(second, 'data')
  await device.sendChunks(['ready\r\n'])
  const [data] = await secondData

  assert.equal(data.toString('utf8'), 'ready\r\n')
  assert.equal(device.report().transcript.filter(entry => entry.event === 'connect').length, 2)
})
