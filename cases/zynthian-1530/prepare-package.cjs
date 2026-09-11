const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(process.argv[2] || 'sources/zynthian-1530')
const passport = require('../../scripts/case.cjs').load('zynthian-1530')
const revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (revision !== passport.source.commit) throw new Error('Unexpected upstream revision')

const patch = path.resolve(__dirname, 'repair.patch')
execFileSync('git', ['-C', root, 'apply', '--check', patch], { stdio: 'inherit' })
execFileSync('git', ['-C', root, 'apply', patch], { stdio: 'inherit' })

for (const file of [
  'zyngui/zynthian_gui.py',
  'zyngine/zynthian_engine_audio_mixer.py',
  'zynlibs/zynmixer/mixer.c',
  'zynlibs/zynmixer/mixer.h',
]) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing patched source: ${file}`)
}
