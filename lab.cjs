const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const { execFileSync } = require('node:child_process')

// Execute reviewed, pinned module sources only. The VM supplies a Companion
// test double; it is not a security sandbox or a full Companion runtime.
const root = process.env.LAB_SOURCES || path.resolve(__dirname, '..')
const revisions = {
  oldIntelix: '619fcc10247f452a8ee2173a6ba037fcb6633b6f',
  intelix: 'c789f20a12de58b84d28c0d76699e0f0e1ae7017',
  tcc2: 'dadb40eb06cf9865c92689a20656df1d50488c11',
}
function source(repo, revision, file) {
  return execFileSync('git', ['-C', path.join(root, repo), 'show', `${revision}:${file}`], { encoding: 'utf8' })
}
function load(repo, revision, file, base = {}) {
  const module = { exports: {} }
  vm.runInNewContext(source(repo, revision, file), {
    module, exports: module.exports,
    require(name) {
      if (name === '@companion-module/base') return base
      if (name.startsWith('./')) return load(repo, revision, `src/${name.slice(2)}.js`, base)
      throw new Error(`Unexpected dependency: ${name}`)
    },
  }, { filename: file, timeout: 1000 })
  return module.exports
}
class InstanceBase {
  setActionDefinitions(actions) { this.actions = actions }
  setFeedbackDefinitions(feedbacks) { this.feedbacks = feedbacks }
  setVariableDefinitions() {}
  setVariableValues() {}
  checkFeedbacks() {}
  updateStatus(status) { this.status = status }
  log() {}
}
const base = { InstanceBase, Regex: {}, combineRgb: () => 0, InstanceStatus: { Ok: 'ok', Connecting: 'connecting', ConnectionFailure: 'connection_failure' } }
const results = []
async function check(name, fn) {
  try { await fn(); results.push({ name, status: 'PASS' }) }
  catch (e) { results.push({ name, status: 'FAIL', error: e.message }) }
}
async function main() {
  const Old = load('intelix', revisions.oldIntelix, 'src/main.js', base)
  const Fixed = load('intelix', revisions.intelix, 'src/main.js', base)
  await check('Intelix negative control: old route command is rejected', async () => {
    const old = new Old()
    let sent
    old.socket = { isConnected: true, sendAsync: async (s) => { sent = s } }
    await old.route(1, 8)
    assert.equal(sent, 'i01o08\r\n')
    assert.notEqual(sent, 'swi01o08\r\n')
  })
  await check('Intelix fixed action sends documented command and reads state', async () => {
    const fixed = new Fixed()
    const sent = []
    fixed.socket = { isConnected: true, sendAsync: async (s) => sent.push(s) }
    fixed.setDefinitions()
    await fixed.actions.route.callback({ options: { input: 1, output: 8 } })
    assert.deepEqual(sent, ['swi01o08\r\n', 'read\r\n'])
    assert.equal(fixed.outputs.size, 0, 'sending must not fabricate confirmed state')
    fixed.config = {}
    fixed.handleData(Buffer.from('o08 i01 video on au'))
    assert.equal(fixed.outputs.size, 0)
    fixed.handleData(Buffer.from('dio off\r\n'))
    assert.equal(fixed.outputs.get(8).input, 1)
    assert.equal(fixed.outputs.get(8).audio, false)
  })
  await check('Intelix disconnected command fails', async () => {
    const fixed = new Fixed()
    await assert.rejects(() => fixed.send('read'), /not connected/)
  })
  await check('BCL-001: Intelix responds to a login prompt without newline', async () => {
    const fixed = new Fixed()
    fixed.config = { username: 'lab-user' }
    const sent = []
    fixed.socket = { isConnected: true, sendAsync: async (s) => sent.push(s) }
    fixed.handleData(Buffer.from('User'))
    fixed.handleData(Buffer.from('name: '))
    await Promise.resolve()
    assert.deepEqual(sent, ['lab-user\r\n'], 'Telnet prompts may be fragmented and omit a newline')
  })
  await check('BCL-002: TCC2 error-only reply must not mark connection healthy', () => {
    const Tcc2 = load('tcc2', revisions.tcc2, 'src/main.js', base)
    const instance = new Tcc2()
    instance.status = 'connecting'
    instance.handleMessage(Buffer.from('{"osc":{"error":[400,{"desc":"not understood"}]}}'))
    assert.notEqual(instance.status, 'ok', 'A protocol error is not successful device state')
  })
  const ssc = load('tcc2', revisions.tcc2, 'src/ssc-protocol.js')
  await check('TCC2 preserves zero angles and false activity', () => {
    const update = ssc.parseSscMessage('{"m":{"beam":{"azimuth":0,"elevation":0}},"audio":{"room_in_use":false,"mute":false}}')
    assert.equal(update.azimuth, 0)
    assert.equal(update.elevation, 0)
    assert.equal(update.roomInUse, false)
    assert.equal(update.muted, false)
  })
  await check('TCC2 malformed message is rejected', () => {
    assert.equal(ssc.parseSscMessage('{broken'), null)
  })
  await check('TCC2 camera sector crosses zero correctly', () => {
    assert.equal(ssc.azimuthInRange(359, 330, 30), true)
    assert.equal(ssc.azimuthInRange(1, 330, 30), true)
    assert.equal(ssc.azimuthInRange(180, 330, 30), false)
    assert.equal(ssc.azimuthInRange(null, 330, 30), false)
  })
  const report = {
    schema: 1, created: new Date().toISOString(), evidence: 'software-contract-tests',
    hardwareVerified: false, revisions, results,
    limitations: ['No physical hardware', 'No real network transport', 'Companion API test double, not full runtime', 'No reconnect or authentication qualification'],
  }
  fs.mkdirSync(path.join(__dirname, 'reports'), { recursive: true })
  fs.writeFileSync(path.join(__dirname, 'reports/latest.json'), JSON.stringify(report, null, 2) + '\n')
  for (const r of results) console.log(`${r.status}: ${r.name}${r.error ? ': ' + r.error : ''}`)
  if (results.some(r => r.status === 'FAIL')) process.exitCode = 1
}
main().catch(e => { console.error(e); process.exitCode = 1 })
