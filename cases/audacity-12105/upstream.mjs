import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const scenario = readFileSync(path.join(root, 'src/project/internal/opensaveprojectscenario.cpp'), 'utf8')
const implementation = path.join(root, 'src/project/internal/projectpathutils.cpp')
if (!existsSync(implementation)) {
  if (scenario.includes('+ " (*)"') && scenario.includes('+ " (*.)"')) {
    console.error('BUG_INVALID_AUP4_FILTER: baseline appends a second parenthesized wildcard group')
    process.exit(1)
  }
  console.error('BASELINE_CONTRACT_CHANGED')
  process.exit(2)
}

const directory = mkdtempSync(path.join(tmpdir(), 'audacity-filter-'))
const test = path.join(directory, 'test.cpp')
const binary = path.join(directory, 'test')
writeFileSync(test, `
#include <cassert>
#include <string>
#include "${path.join(root, 'src/project/internal/projectpathutils.h')}"
int main() {
  assert(au::project::aup4SaveFilter("Audacity 4 files") == "Audacity 4 files (*.aup4)");
}
`)
const compile = spawnSync('c++', ['-std=c++17', '-Wall', '-Wextra', '-Werror', implementation, test, '-o', binary], { encoding: 'utf8' })
if (compile.status !== 0) {
  process.stderr.write(compile.stderr)
  process.exit(compile.status || 2)
}
const run = spawnSync(binary, [], { encoding: 'utf8' })
if (run.status !== 0) process.exit(run.status || 2)
console.log('# tests 1')
