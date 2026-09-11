import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/ola-1850')
const report = {
  issue: 'https://github.com/OpenLightingProject/ola/issues/1850',
  revision: '99b26c65d45e807032c1337ca7ebf1ac51ff3995',
  evidence: 'Linux kernel descriptor probe plus production KiNET initialization and regression-test contract checks',
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

record('Linux UDP descriptor changes from blocking to non-blocking', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bcl-ola-'))
  const test = path.join(directory, 'nonblocking-probe.cpp')
  const binary = path.join(directory, 'nonblocking-probe')
  writeFileSync(test, `
#include <cassert>
#include <fcntl.h>
#include <sys/socket.h>
#include <unistd.h>
int main() {
  const int fd = socket(AF_INET, SOCK_DGRAM, 0);
  assert(fd >= 0);
  const int before = fcntl(fd, F_GETFL, 0);
  assert(before >= 0 && !(before & O_NONBLOCK));
  assert(fcntl(fd, F_SETFL, before | O_NONBLOCK) == 0);
  const int after = fcntl(fd, F_GETFL, 0);
  assert(after >= 0 && (after & O_NONBLOCK));
  close(fd);
}
`)
  execFileSync('c++', ['-std=c++11', '-Wall', '-Wextra', '-Werror', test, '-o', binary])
  execFileSync(binary)
})

record('KiNET enables non-blocking mode before binding the socket', () => {
  const implementation = readFileSync(path.join(source, 'plugins/kinet/KiNetNode.cpp'), 'utf8')
  const nonBlocking = implementation.indexOf('ConnectedDescriptor::SetNonBlocking')
  const bind = implementation.indexOf('socket->Bind(', nonBlocking)
  if (nonBlocking < 0) throw new Error('KiNET does not request non-blocking mode')
  if (bind < 0 || bind < nonBlocking) throw new Error('KiNET socket is not configured before bind/use')
  if (!implementation.includes('Failed to make KiNet socket non-blocking')) throw new Error('Initialization failure is not reported')
})

record('OLA regression test inspects the real KiNET descriptor flag', () => {
  const test = readFileSync(path.join(source, 'plugins/kinet/KiNetNodeTest.cpp'), 'utf8')
  for (const fragment of ['testSocketIsNonBlocking', 'F_GETFL', 'O_NONBLOCK', 'testSendDMX', 'testSendPortOut']) {
    if (!test.includes(fragment)) throw new Error(`Missing regression contract: ${fragment}`)
  }
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/ola-1850.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
