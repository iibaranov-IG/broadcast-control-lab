import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const implementation = path.join(root, 'src/project/internal/projectpathutils.cpp')
if (!existsSync(implementation)) {
  const scenario = readFileSync(path.join(root, 'src/project/internal/opensaveprojectscenario.cpp'), 'utf8')
  if (scenario.includes('correctedPath.substr') && scenario.includes('correctedPath += "aup4"')) {
    console.error('BUG_DOUBLE_AUP4: baseline removes only the final suffix before restoring aup4')
    process.exit(1)
  }
  console.error('BASELINE_CONTRACT_CHANGED')
  process.exit(2)
}

const directory = mkdtempSync(path.join(tmpdir(), 'audacity-path-'))
const test = path.join(directory, 'test.cpp')
const binary = path.join(directory, 'test')
writeFileSync(test, `
#include <cassert>
#include <string>
#include "${path.join(root, 'src/project/internal/projectpathutils.h')}"
int main() {
  using au::project::forceAup4Extension;
  assert(forceAup4Extension("/projects/session") == "/projects/session.aup4");
  assert(forceAup4Extension("/projects/session.wav") == "/projects/session.aup4");
  assert(forceAup4Extension("/projects/session.aup4") == "/projects/session.aup4");
  assert(forceAup4Extension("/projects/session.aup4.aup4") == "/projects/session.aup4");
  assert(forceAup4Extension("/projects/session.AUP4.aup4") == "/projects/session.aup4");
  assert(forceAup4Extension("/projects.with.dots/session") == "/projects.with.dots/session.aup4");
}
`)
const compile = spawnSync('c++', ['-std=c++17', '-Wall', '-Wextra', '-Werror', implementation, test, '-o', binary], { encoding: 'utf8' })
if (compile.status !== 0) {
  process.stderr.write(compile.stderr)
  process.exit(compile.status || 2)
}
const run = spawnSync(binary, [], { encoding: 'utf8' })
if (run.status !== 0) process.exit(run.status || 2)
console.log('# tests 6')
