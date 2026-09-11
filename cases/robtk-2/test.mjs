import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/robtk-2')
const report = {
  issue: 'https://github.com/x42/robtk/issues/2',
  revision: 'c6c3ade30b1cffb12e4cd6eda5a46bf1c96cb318',
  evidence: 'GNU Make dependency invalidation with the production robtk.mk pattern rule',
  hardwareVerified: false,
  results: [],
}
const record = (name, fn) => {
  const started = performance.now()
  try { fn(); report.results.push({ name, status: 'PASS', durationMs: Math.round(performance.now() - started) }) }
  catch (error) { report.results.push({ name, status: 'FAIL', durationMs: Math.round(performance.now() - started), message: error.message }) }
}

record('changing PLUGIN_SOURCE invalidates and rebuilds every UI target', () => {
  const work = mkdtempSync(path.join(tmpdir(), 'bcl-robtk-make-'))
  mkdirSync(path.join(work, 'gui'))
  mkdirSync(path.join(work, 'build'))
  const compiler = path.join(work, 'fake-cxx')
  writeFileSync(compiler, `#!/bin/sh
while [ "$#" -gt 0 ]; do
  if [ "$1" = -o ]; then shift; mkdir -p "$(dirname "$1")"; : > "$1"; exit 0; fi
  shift
done
exit 2
`)
  chmodSync(compiler, 0o755)
  writeFileSync(path.join(work, 'Makefile'), `RW=${source}/
PUGL_SRC=${source}/pugl/pugl_x11.c
CXX=${compiler}
STRIP=true
include ${source}/robtk.mk
`)
  const gui = path.join(work, 'gui/demo.c')
  const targets = ['build/demoUI_gtk.so', 'build/demoUI_gl.o', 'build/demo_glui.so', 'build/demoUI_gl.so']
  writeFileSync(gui, '/* first */\n')
  execFileSync('make', ['-s', '-C', work, ...targets])
  for (const target of targets) {
    if (spawnSync('make', ['-q', '-C', work, target]).status !== 0) throw new Error(`fresh ${target} is unexpectedly stale`)
  }
  execFileSync('sleep', ['1'])
  writeFileSync(gui, '/* changed */\n')
  for (const target of targets) {
    if (spawnSync('make', ['-q', '-C', work, target]).status !== 1) throw new Error(`changed PLUGIN_SOURCE did not invalidate ${target}`)
  }
  execFileSync('make', ['-s', '-C', work, ...targets])
  for (const target of targets) {
    if (spawnSync('make', ['-q', '-C', work, target]).status !== 0) throw new Error(`rebuilt ${target} is still stale`)
  }
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/robtk-2.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
