import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/obs-ptz-144')
const report = {
  issue: 'https://github.com/glikely/obs-ptz/issues/144',
  revision: 'e15fdeabcb76098a7cc1154aeb836e6f6eee91a7',
  evidence: 'compiled production DataVideo stream framer plus OBS send, receive and settings contract checks',
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
const requireText = (text, fragment) => {
  if (!text.includes(fragment)) throw new Error(`Missing application contract: ${fragment}`)
}

record('Production framer handles exact, fragmented, coalesced and invalid frames', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bcl-obs-ptz-'))
  const test = path.join(directory, 'datavideo-framing-test.cpp')
  const binary = path.join(directory, 'datavideo-framing-test')
  writeFileSync(test, `
#include <cassert>
#include <cstdint>
#include <vector>
#include "src/datavideo-visca-framing.hpp"
int main() {
  const uint8_t command[] = {0x81, 0x09, 0x7e, 0x7e, 0x00, 0xff};
  const std::vector<uint8_t> expected = {0x00, 0x08, 0x81, 0x09, 0x7e, 0x7e, 0x00, 0xff};
  assert(DatavideoViscaFramer::encode(command, sizeof(command)) == expected);
  assert(DatavideoViscaFramer::encode(nullptr, 0).empty());

  DatavideoViscaFramer parser;
  std::vector<std::vector<uint8_t>> frames;
  assert(parser.feed(expected.data(), 3, frames) && frames.empty());
  assert(parser.feed(expected.data() + 3, expected.size() - 3, frames));
  assert(frames.size() == 1);
  assert(frames[0] == std::vector<uint8_t>(command, command + sizeof(command)));

  frames.clear();
  std::vector<uint8_t> doubled = expected;
  doubled.insert(doubled.end(), expected.begin(), expected.end());
  assert(parser.feed(doubled.data(), doubled.size(), frames));
  assert(frames.size() == 2 && frames[0] == frames[1]);

  const uint8_t invalid[] = {0x00, 0x02};
  frames.clear();
  assert(!parser.feed(invalid, sizeof(invalid), frames));
}
`)
  execFileSync('c++', ['-std=c++17', '-Wall', '-Wextra', '-Werror', '-I', source, test, '-o', binary])
  execFileSync(binary)
})

record('DataVideo framing is opt-in and wired through both TCP directions', () => {
  const implementation = readFileSync(path.join(source, 'src/ptz-visca-tcp.cpp'), 'utf8')
  requireText(implementation, 'if (!datavideo_framing)')
  requireText(implementation, 'DatavideoViscaFramer::encode')
  requireText(implementation, 'datavideo_framer.feed')
  requireText(implementation, 'obs_data_set_default_bool(config, "datavideo_framing", false)')
  requireText(implementation, 'obs_data_set_bool(config, "datavideo_framing", datavideo_framing)')
})

record('Settings expose a separate preconfigured DataVideo device', () => {
  const settings = readFileSync(path.join(source, 'src/settings.cpp'), 'utf8')
  const locale = readFileSync(path.join(source, 'data/locale/en-US.ini'), 'utf8')
  requireText(settings, 'PTZ.Visca.TCP.DataVideoName')
  requireText(settings, 'obs_data_set_bool(cfg, "datavideo_framing", true)')
  requireText(locale, 'PTZ.Visca.TCP.DataVideoName="Datavideo VISCA TCP"')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/obs-ptz-144.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
