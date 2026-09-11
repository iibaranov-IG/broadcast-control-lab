import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ScriptedUdpDevice } from '../../lib/scripted-udp-device.mjs'

const source = resolve(process.argv[2] || 'sources/zynthian-1530')
const support = fileURLToPath(new URL('./test-support/', import.meta.url))
const output = join(mkdtempSync(join(tmpdir(), 'bcl-zynthian-')), 'osc-routing')
const report = {
  issue: 'https://github.com/zynthian/zynthian-issue-tracking/issues/1530',
  evidence: 'native-osc-loopback',
  hardwareVerified: false,
  source: { repository: 'zynthian/zynthian-ui', revision: '11d4e858367db465a431c701d9035432742a5a7d', branch: 'oram' },
  results: [],
}

function oscFloat(path, value) {
  const paddedString = text => {
    const raw = Buffer.from(`${text}\0`)
    return Buffer.concat([raw, Buffer.alloc((4 - raw.length % 4) % 4)])
  }
  const number = Buffer.alloc(4)
  number.writeFloatBE(value)
  return Buffer.concat([paddedString(path), paddedString(',f'), number])
}

async function check(name, callback) {
  const started = performance.now()
  try {
    await callback()
    report.results.push({ name, status: 'PASS', durationMs: performance.now() - started })
  } catch (error) {
    report.results.push({ name, status: 'FAIL', message: error.message, durationMs: performance.now() - started })
  }
}

await check('Python registry keys clients by host and source port', () => {
  const gui = readFileSync(join(source, 'zyngui/zynthian_gui.py'), 'utf8')
  const wrapper = readFileSync(join(source, 'zyngine/zynthian_engine_audio_mixer.py'), 'utf8')
  assert.match(gui, /client = \(src\.hostname, int\(src\.port\)\)/)
  assert.match(gui, /add_osc_client\(\*client\)/)
  assert.match(gui, /remove_osc_client\(\*client\)/)
  assert.match(wrapper, /addOscClient\.argtypes = \[\s*ctypes\.c_char_p, ctypes\.c_uint16\]/)
  assert.match(wrapper, /def add_osc_client\(self, client, port\)/)
  assert.match(wrapper, /def remove_osc_client\(self, client, port\)/)
})

await check('Pinned upstream revision reproduces the fixed-port contract', () => {
  const baselineMixer = execFileSync('git', [
    '-C', source, 'show', 'HEAD:zynlibs/zynmixer/mixer.c',
  ], { encoding: 'utf8' })
  const baselineGui = execFileSync('git', [
    '-C', source, 'show', 'HEAD:zyngui/zynthian_gui.py',
  ], { encoding: 'utf8' })
  assert.match(baselineMixer, /sin_port\s*=\s*htons\(1370\)/)
  assert.match(baselineGui, /if src\.hostname not in self\.osc_clients/)
  assert.match(baselineGui, /self\.osc_clients\[src\.hostname\]\s*=\s*monotonic\(\)/)
  report.baseline = {
    observedClientKey: 'hostname',
    observedFeedbackPort: 1370,
  }
})

await check('Native sender builds with the patched endpoint API', () => {
  execFileSync('cc', [
    '-std=gnu11', '-O0',
    ...(process.platform === 'darwin' ? ['-DMSG_CONFIRM=0'] : []),
    `-I${support}`,
    `-I${join(source, 'zynlibs/zynmixer')}`,
    join(support, 'osc-routing.c'),
    join(support, 'jack-stub.c'),
    join(source, 'zynlibs/zynmixer/mixer.c'),
    join(source, 'zynlibs/zynmixer/tinyosc.c'),
    '-pthread', '-lm', '-o', output,
  ], { stdio: 'pipe' })
})

const first = new ScriptedUdpDevice()
const second = new ScriptedUdpDevice()
try {
  const firstEndpoint = await first.start()
  const secondEndpoint = await second.start()
  await check('Feedback follows both registered source ports', async () => {
    const child = spawn(output, [String(firstEndpoint.port), String(secondEndpoint.port)], { stdio: ['ignore', 'pipe', 'pipe'] })
    let stderr = ''
    child.stderr.setEncoding('utf8')
    child.stderr.on('data', chunk => { stderr += chunk })
    const exit = new Promise((resolveExit, reject) => {
      child.once('error', reject)
      child.once('exit', (code, signal) => code === 0
        ? resolveExit()
        : reject(new Error(`routing helper exited ${code ?? signal}: ${stderr}`)))
    })
    await exit
    await Promise.all([
      first.run([{ expect: oscFloat('/mixer/fader0', 0.5), replies: [] }]),
      second.run([
        { expect: oscFloat('/mixer/fader0', 0.5), replies: [] },
        { expect: oscFloat('/mixer/balance0', 0.25), replies: [] },
      ]),
    ])
    await assert.rejects(first.receive({ timeoutMs: 100 }), /Timed out/)
  })
  report.udp = { first: first.report(), second: second.report() }
} finally {
  await Promise.all([first.stop(), second.stop()])
}

mkdirSync(new URL('../../reports/', import.meta.url), { recursive: true })
writeFileSync(new URL('../../reports/zynthian-1530.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
