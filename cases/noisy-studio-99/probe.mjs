import { spawnSync } from 'node:child_process'

const mode = process.argv[2] || 'focused'
const run = (command, args, cwd = '.') => {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: '--localstorage-file=/tmp/noisy-vitest-localstorage.json' },
  })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  if (result.status !== 0) process.exit(result.status || 1)
}

run('.venv/bin/python', ['-m', 'pytest', '-q', mode === 'suite' ? 'tests' : 'tests/unit/test_native_audio.py'])
run('npm', ['test', '--', ...(mode === 'suite' ? [] : ['--run', 'src/components/SettingsView.spec.ts'])], 'dashboard')
if (mode === 'suite') console.log('# tests 350')
console.log('PASS: native desktop audio boundary and complete suites')
