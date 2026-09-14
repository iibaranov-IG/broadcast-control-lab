import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
const compiler = process.env.CC || 'cc'
const binary = '/tmp/midimonster-sacn-discovery-test'
const compile = spawnSync(compiler, ['-Wall','-Wextra','-ffunction-sections','-fdata-sections','-I.','tests/sacn_discovery.c','-Wl,--gc-sections','-o',binary], { encoding:'utf8' })
if (compile.status !== 0) {
  console.log('BUG_INVALID_SACN_DISCOVERY_LIST')
  process.stderr.write(compile.stderr || '')
  process.exit(1)
}
const run = spawnSync(binary, [], { encoding:'utf8' })
if (run.status !== 0) {
  console.log('BUG_INVALID_SACN_DISCOVERY_LIST')
  process.exit(1)
}
fs.rmSync(binary, { force:true })
console.log('# tests 1')
