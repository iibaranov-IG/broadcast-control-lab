import { spawnSync } from 'node:child_process'

const result = spawnSync(process.execPath, ['tests/update-reattach.test.js'], {
  encoding: 'utf8',
})
process.stdout.write(result.stdout || '')
process.stderr.write(result.stderr || '')
if (result.status !== 0) process.exit(result.status || 1)
console.log('# tests 10')
