import dgram from 'node:dgram'
import { setTimeout as delay } from 'node:timers/promises'

// Local functional test endpoint. Each receive consumes one whole datagram.
export class ScriptedUdpDevice {
  constructor() {
    this.socket = null
    this.queue = []
    this.waiters = []
    this.transcript = []
  }

  async start() {
    if (this.socket) throw new Error('Device already running')
    this.queue = []
    this.transcript = []
    const socket = this.socket = dgram.createSocket('udp4')
    socket.on('message', (data, peer) => {
      const packet = { data: Buffer.from(data), peer: { address: peer.address, port: peer.port } }
      this.record('client-to-device', packet.data, packet.peer)
      const waiter = this.waiters.shift()
      if (waiter) { clearTimeout(waiter.timer); waiter.resolve(packet) }
      else this.queue.push(packet)
    })
    socket.on('error', error => {
      for (const waiter of this.waiters.splice(0)) { clearTimeout(waiter.timer); waiter.reject(error) }
    })
    await new Promise((resolve, reject) => {
      socket.once('error', reject)
      socket.bind(0, '127.0.0.1', () => { socket.removeListener('error', reject); resolve() })
    })
    this.endpoint = { host: '127.0.0.1', port: socket.address().port }
    return this.endpoint
  }

  receive({ timeoutMs = 1000 } = {}) {
    if (!this.socket) return Promise.reject(new Error('Device stopped'))
    if (this.queue.length) return Promise.resolve(this.queue.shift())
    return new Promise((resolve, reject) => {
      const waiter = { resolve, reject }
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter(w => w !== waiter)
        reject(new Error('Timed out waiting for datagram'))
      }, timeoutMs)
      this.waiters.push(waiter)
    })
  }

  async send(data, peer) {
    if (!this.socket) throw new Error('Device stopped')
    if (peer.address !== '127.0.0.1') throw new Error('Only loopback peers are supported')
    const bytes = Buffer.from(data)
    await new Promise((resolve, reject) => this.socket.send(bytes, peer.port, peer.address, error => error ? reject(error) : resolve()))
    this.record('device-to-client', bytes, peer)
  }

  async run(steps, { timeoutMs = 1000 } = {}) {
    for (const [index, step] of steps.entries()) {
      const { data, peer } = await this.receive({ timeoutMs })
      if (!data.equals(Buffer.from(step.expect))) throw new Error(`Datagram mismatch at step ${index + 1}: ${data.toString('hex')}`)
      // An empty replies array deliberately models silence / a lost reply.
      for (const reply of step.replies || []) {
        if (reply.delayMs) await delay(reply.delayMs)
        await this.send(reply.data, peer)
      }
    }
  }

  record(event, data, peer) {
    this.transcript.push({ sequence: this.transcript.length + 1, event, hex: data.toString('hex'), bytes: data.length, peer: { ...peer } })
  }

  report() {
    return { schema: 1, evidence: 'scripted-udp-device', hardwareVerified: false,
      endpoint: { ...this.endpoint }, transcript: structuredClone(this.transcript) }
  }

  async stop() {
    for (const waiter of this.waiters.splice(0)) { clearTimeout(waiter.timer); waiter.reject(new Error('Device stopped')) }
    const socket = this.socket
    this.socket = null
    this.queue = []
    if (socket) await new Promise(resolve => socket.close(resolve))
  }
}
