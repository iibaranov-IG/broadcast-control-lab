import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/fader-x-5')
const report = {
  issue: 'https://github.com/stagehacks/FADER_X/issues/5',
  revision: '67d33542f5b9999a38a0165a65d882026958d058',
  evidence: 'compiled production address generator plus firmware receive/UI contract checks',
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
  if (!text.includes(fragment)) throw new Error(`Missing firmware contract: ${fragment}`)
}

record('X Air and X32 output addresses and limits match their mixer profiles', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bcl-fader-x-'))
  const test = path.join(directory, 'address-test.cpp')
  const binary = path.join(directory, 'address-test')
  writeFileSync(test, `
#include <cassert>
#include <cstring>
#include "FADER_X/X32Address.h"
static void expect(bool xAir, uint8_t target, uint8_t channel, const char* expected){
  char address[32] = {};
  assert(x32FaderAddress(xAir, target, channel, address, sizeof(address)));
  assert(std::strcmp(address, expected) == 0);
}
static void reject(bool xAir, uint8_t target, uint8_t channel){
  char address[32] = {};
  assert(!x32FaderAddress(xAir, target, channel, address, sizeof(address)));
}
int main(){
  expect(true, 1, 16, "/ch/16/mix/fader");
  expect(true, 2, 4, "/dca/4/fader");
  expect(true, 3, 6, "/bus/06/mix/fader");
  expect(true, 4, 1, "/rtn/aux/mix/fader");
  expect(true, 5, 1, "/rtn/1/mix/fader");
  expect(true, 5, 4, "/rtn/4/mix/fader");
  reject(true, 1, 17); reject(true, 2, 5); reject(true, 3, 7);
  reject(true, 4, 2); reject(true, 5, 5); reject(true, 6, 1);
  expect(false, 1, 32, "/ch/32/mix/fader");
  expect(false, 2, 8, "/dca/8/fader");
  expect(false, 3, 16, "/bus/16/mix/fader");
  expect(false, 4, 8, "/auxin/08/mix/fader");
  expect(false, 5, 8, "/fxrtn/08/mix/fader");
  expect(false, 6, 8, "/mtx/08/mix/fader");
}
`)
  execFileSync('c++', ['-std=c++11', '-Wall', '-Wextra', '-Werror', '-I', source, test, '-o', binary])
  execFileSync(binary)
})

record('Firmware accepts the matching X Air Aux and FX Return updates', () => {
  const firmware = readFileSync(path.join(source, 'FADER_X/X32.cpp'), 'utf8')
  requireText(firmware, 'globalMode == OP_XAIR && xTarget == 4 && msg.match("/rtn/aux/mix/fader")')
  requireText(firmware, 'globalMode == OP_XAIR && xTarget == 5 && msg.match("/rtn/*/mix/fader")')
  requireText(firmware, 'x32FaderTargetSupported(true, xTarget, channel)')
})

record('X Air configuration exposes valid returns and omits Matrix', () => {
  const ui = readFileSync(path.join(source, 'FADER_X/WebServer.ino'), 'utf8')
  const start = ui.indexOf('String xAirTemplate')
  const end = ui.indexOf('String tuningTemplate', start)
  if (start < 0 || end < 0) throw new Error('X Air configuration template not found')
  const template = ui.slice(start, end)
  requireText(template, "value='4'")
  requireText(template, 'Aux In / USB Playback')
  requireText(template, "value='5'")
  requireText(template, 'FX Return')
  if (template.includes("value='6'") || template.includes('Matrix')) throw new Error('Matrix remains selectable in X Air mode')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/fader-x-5.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
