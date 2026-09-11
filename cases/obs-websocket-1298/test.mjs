import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/obs-websocket-1298')
const report = {
  issue: 'https://github.com/obsproject/obs-websocket/issues/1298',
  revision: '1ef34bf48110c2a18184e50e41cd0b1a855e2147',
  evidence: 'Compiled production MIME helper plus screenshot response wiring contract',
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

record('jpg and jpeg use the registered image/jpeg type', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'bcl-obs-mime-'))
  const probe = path.join(directory, 'probe.cpp')
  const binary = path.join(directory, 'probe')
  writeFileSync(probe, `
#include <cassert>
#include "src/utils/ImageFormat.h"
int main() {
  assert(ImageMimeType("jpg") == "image/jpeg");
  assert(ImageMimeType("jpeg") == "image/jpeg");
  assert(ImageMimeType("png") == "image/png");
  assert(ImageMimeType("webp") == "image/webp");
}
`)
  execFileSync(process.env.CXX || 'c++', ['-std=c++17', '-Wall', '-Wextra', '-Werror', `-I${source}`, probe, '-o', binary])
  execFileSync(binary)
})

record('GetSourceScreenshot builds the Data URI from the MIME helper', () => {
  const implementation = readFileSync(path.join(source, 'src/requesthandler/RequestHandler_Sources.cpp'), 'utf8')
  if (!implementation.includes('QString("data:%1;base64,")')) throw new Error('Data URI prefix still hard-codes image/<format>')
  if (!implementation.includes('ImageMimeType(imageFormat).c_str()')) throw new Error('Screenshot response does not use the MIME helper')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/obs-websocket-1298.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
