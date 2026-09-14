import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const compiler = process.env.CXX || 'c++'
const binary = '/tmp/ola-descriptor-1995-test'
const compile = spawnSync(compiler, [
  '-std=c++11', '-Wall', '-Wextra', '-Werror', '-Iinclude',
  '../../cases/ola-1995/upstream.cpp', 'common/messaging/Descriptor.cpp',
  '-o', binary,
], { encoding: 'utf8' })
if (compile.status !== 0) {
  console.log('BUG_LABELED_VALUE_REJECTED')
  process.stderr.write(compile.stderr || '')
  process.exit(1)
}
const run = spawnSync(binary, [], { encoding: 'utf8' })
fs.rmSync(binary, { force: true })
if (run.status !== 0) {
  console.log('BUG_LABELED_VALUE_REJECTED')
  process.exit(1)
}
console.log('# tests 3')
