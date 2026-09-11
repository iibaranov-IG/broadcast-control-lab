import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/ola-2031')
const report = {
  issue: 'https://github.com/OpenLightingProject/ola/issues/2031',
  revision: '99b26c65d45e807032c1337ca7ebf1ac51ff3995',
  evidence: 'Production ClientWrapper constructor probe plus one-shot teardown and regression-test contract checks',
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

record('production ClientWrapper forwards the close callback', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bcl-ola-python-'))
  const probe = path.join(directory, 'probe.py')
  writeFileSync(probe, `
import importlib.util
import socket
import sys
import types

captured = []
ola_package = types.ModuleType('ola')
ola_package.__path__ = []
ola_logger = types.ModuleType('ola.ola_logger')
ola_client_module = types.ModuleType('ola.OlaClient')

class FakeOlaClient:
  def __init__(self, our_socket=None, close_callback=None):
    self.socket = our_socket
    captured.append(close_callback)
  def GetSocket(self):
    return self.socket
  def SocketReady(self):
    pass

ola_client_module.OlaClient = FakeOlaClient
sys.modules['ola'] = ola_package
sys.modules['ola.ola_logger'] = ola_logger
sys.modules['ola.OlaClient'] = ola_client_module

spec = importlib.util.spec_from_file_location('candidate_client_wrapper', sys.argv[1])
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
left, right = socket.socketpair()
callback = lambda: None
wrapper = module.ClientWrapper(left, close_callback=callback)
assert captured == [callback]
right.close()
left.close()
`)
  execFileSync('python3', [probe, path.join(source, 'python/ola/ClientWrapper.py')])
})

record('OlaClient teardown is idempotent and consumes the callback', () => {
  const implementation = readFileSync(path.join(source, 'python/ola/OlaClient.py'), 'utf8')
  const guard = implementation.indexOf('if self._socket is None:')
  const clearSocket = implementation.indexOf('self._socket = None', guard)
  const shutdown = implementation.indexOf('our_socket.shutdown', guard)
  const clearCallback = implementation.indexOf('self._close_callback = None', guard)
  const invoke = implementation.indexOf('close_callback()', guard)
  if (guard < 0 || clearSocket < guard || shutdown < clearSocket) throw new Error('Socket is not cleared before teardown')
  if (clearCallback < shutdown || invoke < clearCallback) throw new Error('Callback is not consumed before invocation')
})

record('upstream regression test requests and repeats socket closure', () => {
  const test = readFileSync(path.join(source, 'python/ola/ClientWrapperTest.py'), 'utf8')
  for (const fragment of ['def testCloseCallback(self):', 'close_callback=on_close', 'wrapper.Client()._SocketClosed()', 'self.assertEqual([1], callback_count)']) {
    if (!test.includes(fragment)) throw new Error(`Missing regression contract: ${fragment}`)
  }
  if (test.split('wrapper.Client()._SocketClosed()').length - 1 < 2) throw new Error('Repeated close is not covered')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/ola-2031.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
