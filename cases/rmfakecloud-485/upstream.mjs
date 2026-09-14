import { spawnSync } from 'node:child_process'

function run(argv, cwd = '.') {
  const result = spawnSync(argv[0], argv.slice(1), { cwd, encoding: 'utf8' })
  process.stdout.write(result.stdout || '')
  process.stderr.write(result.stderr || '')
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(['node', '--test', 'ui/src/pages/ScreenShare/firefoxUsb.test.js'])
run(['node_modules/.bin/tsc', '-b'], 'ui')
run(['node_modules/.bin/vite', 'build'], 'ui')
console.log('BCL_UI_SUITE_COMPLETE')
