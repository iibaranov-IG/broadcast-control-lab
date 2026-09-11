import net from 'node:net'
import { setTimeout as delay } from 'node:timers/promises'

export class ScriptedTcpDevice {
  constructor({ redact = [] } = {}) {
    this.redact = redact
    this.server = null
    this.sockets = new Set()
    this.activeSocket = null
    this.received = ''
    this.transcript = []
    this.waiters = []
  }

  async start({ host = '127.0.0.1', port = 0 } = {}) {
    if (this.server) throw new Error('Device is already running')
    this.server = net.createServer(socket => this.#accept(socket))
    await new Promise((resolve, reject) => {
      this.server.once('error', reject)
      this.server.listen(port, host, resolve)
    })
    const address = this.server.address()
    this.host = address.address
    this.port = address.port
    return { host: this.host, port: this.port }
  }

  async waitForConnection({ timeoutMs = 1000 } = {}) {
    if (this.activeSocket && !this.activeSocket.destroyed) return this.activeSocket
    return this.#waitFor('connection', timeoutMs)
  }

  async waitForData(expected, { timeoutMs = 1000 } = {}) {
    const matches = typeof expected === 'function'
      ? expected
      : value => value.includes(expected)
    if (matches(this.received)) return this.received
    await this.#waitFor('data', timeoutMs, matches)
    return this.received
  }

  async sendChunks(chunks, { delayMs = 0, socket = this.activeSocket } = {}) {
    if (!socket || socket.destroyed) throw new Error('No connected client')
    for (const chunk of chunks) {
      const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      this.#record('device-to-client', data)
      await new Promise((resolve, reject) => {
        socket.write(data, error => error ? reject(error) : resolve())
      })
      if (delayMs > 0) await delay(delayMs)
    }
  }

  disconnect(socket = this.activeSocket) {
    if (socket && !socket.destroyed) {
      this.#record('disconnect', Buffer.alloc(0))
      socket.destroy()
    }
  }

  report(extra = {}) {
    return {
      schema: 1,
      evidence: 'scripted-tcp-device',
      hardwareVerified: false,
      endpoint: { host: this.host, port: this.port },
      transcript: this.transcript,
      ...extra,
    }
  }

  async stop() {
    for (const socket of this.sockets) socket.destroy()
    this.sockets.clear()
    this.activeSocket = null
    if (!this.server) return
    const server = this.server
    this.server = null
    await new Promise(resolve => server.close(resolve))
  }

  #accept(socket) {
    this.sockets.add(socket)
    this.activeSocket = socket
    this.#record('connect', Buffer.alloc(0))
    this.#resolveWaiters('connection', socket)

    socket.on('data', data => {
      this.received += data.toString('utf8')
      this.#record('client-to-device', data)
      this.#resolveWaiters('data', this.received)
    })
    socket.on('close', () => {
      this.sockets.delete(socket)
      if (this.activeSocket === socket) this.activeSocket = null
    })
  }

  #record(event, data) {
    let text = data.toString('utf8')
    for (const secret of this.redact) {
      text = text.replaceAll(secret, '[REDACTED]')
    }
    this.transcript.push({ event, text })
  }

  #waitFor(type, timeoutMs, predicate = () => true) {
    return new Promise((resolve, reject) => {
      const waiter = { type, predicate, resolve, reject, timer: null }
      waiter.timer = setTimeout(() => {
        this.waiters = this.waiters.filter(candidate => candidate !== waiter)
        reject(new Error(`Timed out waiting for ${type}`))
      }, timeoutMs)
      this.waiters.push(waiter)
    })
  }

  #resolveWaiters(type, value) {
    for (const waiter of [...this.waiters]) {
      if (waiter.type !== type || !waiter.predicate(value)) continue
      clearTimeout(waiter.timer)
      this.waiters = this.waiters.filter(candidate => candidate !== waiter)
      waiter.resolve(value)
    }
  }
}

