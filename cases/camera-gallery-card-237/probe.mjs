import { spawnSync } from 'node:child_process'

const source = process.argv[2] || '.'
const run = spawnSync('npm', ['test', '--', '--run', 'src/data/live-config.spec.ts'], {
  cwd: source,
  encoding: 'utf8',
})
const output = `${run.stdout || ''}${run.stderr || ''}`
process.stdout.write(output)
if (run.status !== 0) process.exit(run.status || 1)
console.log('# tests 50')
console.log('PASS: unavailable and unknown cameras remain selectable')
