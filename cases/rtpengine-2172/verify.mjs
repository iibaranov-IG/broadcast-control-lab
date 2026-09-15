import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

function run(argv, options = {}) {
  const result = spawnSync(argv[0], argv.slice(1), { encoding: 'utf8', ...options })
  if (result.status !== 0) {
    process.stderr.write(result.stdout || '')
    process.stderr.write(result.stderr || '')
    process.exit(result.status || 2)
  }
  return result.stdout
}

const source = readFileSync('lib/opus.c', 'utf8')
const generated = run(['utils/const_str_hash', 'lib/opus.c', '-DWITH_TRANSCODING'], { input: source })
const tables = [...generated.matchAll(/TOTAL_KEYWORDS = (\d+)/g)].map((match) => Number(match[1]))
const outer = generated.split('static int __csh_lookup_0', 1)[0]
const outerKeys = ['complexity', 'compression_level', 'application', 'vbr', 'VBR', 'packet_loss', 'packet loss']
if (tables[0] !== 7 || outerKeys.some((key) => !outer.includes(`"${key}"`))) {
  console.error(`OPUS_OUTER_HASH_MISSING_OPTIONS: first table has ${tables[0] ?? 0} keys`)
  process.exit(1)
}
if (tables[1] !== 7) {
  console.error(`OPUS_APPLICATION_HASH_WRONG_SIZE: second table has ${tables[1] ?? 0} keys`)
  process.exit(2)
}

if (process.argv[2] === '--suite') {
  const directory = mkdtempSync(path.join(tmpdir(), 'rtpengine-csh-'))
  const testSource = readFileSync('t/test-const_str_hash.c', 'utf8')
  const testGenerated = run(['utils/const_str_hash', 't/test-const_str_hash.c'], { input: testSource })
  const testFile = path.join(directory, 'test.c')
  const binary = path.join(directory, 'test')
  writeFileSync(testFile, testGenerated)
  const flags = run(['pkg-config', '--cflags', '--libs', 'glib-2.0']).trim().split(/\s+/)
  run(['cc', '-D_GNU_SOURCE', '-std=gnu11', '-Wall', '-Wextra', '-Werror', '-Wno-unused-parameter', '-Ilib', testFile, ...flags, '-o', binary])
  run([binary])
  console.log('# TOTAL: 4')
  console.log('# PASS: 4')
  console.log('# SKIP: 0')
}
