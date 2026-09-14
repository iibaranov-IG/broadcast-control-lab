import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
assert.ok(source, 'source directory required')

const implementation = fs.readFileSync(path.join(source, 'SOURCES/RES_DISCOVERY.CPP'), 'utf8')
const androidDocs = fs.readFileSync(path.join(source, 'docs/ANDROID.md'), 'utf8')

for (const [root, subdir] of [
  ['/sdcard/', 'lba2cc'],
  ['/storage/emulated/0/', 'lba2cc'],
]) {
  const escapedRoot = root.replaceAll('/', '\\/')
  const call = new RegExp(`TryJoinBaseSub\\("${escapedRoot}",\\s*"${subdir}",[\\s\\S]*?&triedCount,\\s*true\\)`)
  assert.match(implementation, call, `${root}${subdir} must accept disc-image-only data`)
}

assert.match(implementation, /NormalizeAndTry\("\/sdcard\/", outDir, outMax, tried, &triedCount\)\)/,
  'the broad /sdcard probe must keep its cheap extracted-file-only check')
assert.match(androidDocs, /The two `lba2cc\/` folders accept either extracted retail files or a disc image/,
  'Android documentation must describe disc-image discovery')

fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/lba2-classic-community-674.json', JSON.stringify({
  hardwareVerified: false,
  applicationVerified: false,
  results: [{ name: 'Android app-data image-discovery policy', status: 'PASS' }],
}, null, 2) + '\n')
console.log('PASS lba2-classic-community-674: app-specific roots accept images; broad roots remain cheap')
