import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/ola-2037')
const report = {
  issue: 'https://github.com/OpenLightingProject/ola/issues/2037',
  revision: '99b26c65d45e807032c1337ca7ebf1ac51ff3995',
  evidence: 'Compiled deterministic response model plus production and upstream regression-test contract checks',
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

record('indices 3, 7, 3 pack as two ordered network entries', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bcl-ola-rdm-'))
  const test = path.join(directory, 'list-interfaces.cpp')
  const binary = path.join(directory, 'list-interfaces')
  writeFileSync(test, `
#include <algorithm>
#include <cassert>
#include <cstdint>
#include <vector>
#include <arpa/inet.h>
struct Interface { uint32_t index; uint16_t type; };
int main() {
  std::vector<Interface> interfaces{{3, 1}, {7, 1}, {3, 1}};
  std::sort(interfaces.begin(), interfaces.end(), [](const auto& a, const auto& b) { return a.index < b.index; });
  interfaces.erase(std::unique(interfaces.begin(), interfaces.end(), [](const auto& a, const auto& b) { return a.index == b.index; }), interfaces.end());
  assert(interfaces.size() == 2);
  assert(interfaces[0].index == 3 && interfaces[1].index == 7);
  assert(htonl(interfaces[0].index) == htonl(3) && htons(interfaces[1].type) == htons(1));
}
`)
  execFileSync('c++', ['-std=c++14', '-Wall', '-Wextra', '-Werror', test, '-o', binary])
  execFileSync(binary)
})

record('production response deduplicates by interface index', () => {
  const implementation = readFileSync(path.join(source, 'common/rdm/ResponderHelper.cpp'), 'utf8')
  for (const fragment of ['std::sort(interfaces.begin()', 'std::unique(', 'return a.index == b.index;', 'interfaces.end());']) {
    if (!implementation.includes(fragment)) throw new Error(`Missing production contract: ${fragment}`)
  }
})

record('OLA regression test checks duplicate addresses and packed output', () => {
  const test = readFileSync(path.join(source, 'common/rdm/ResponderHelperTest.cpp'), 'utf8')
  for (const fragment of ['testListInterfacesIsUnique', 'second_address = first', 'HostToNetwork(static_cast<uint32_t>(3))', 'HostToNetwork(static_cast<uint32_t>(7))', 'OLA_ASSERT_DATA_EQUALS']) {
    if (!test.includes(fragment)) throw new Error(`Missing regression contract: ${fragment}`)
  }
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/ola-2037.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
