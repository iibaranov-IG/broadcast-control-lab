const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const root = path.resolve(process.argv[2] || 'sources/zynthian-1530')
const passport = require('../../scripts/case.cjs').load('zynthian-1530')
const archive = `zynthian-osc-client-port-${passport.packageVersion}.tgz`
fs.writeFileSync(path.join(root, 'BCL-CANDIDATE.md'), [
  'Community test patch for Zynthian issue 1530.',
  'Targets the pinned Oram revision in the BCL case passport.',
  'Hardware verification is pending; test on a non-production device first.',
  'Evidence: https://github.com/iibaranov-IG/broadcast-control-lab/tree/main/cases/zynthian-1530',
  '',
].join('\n'))
execFileSync('tar', [
  '-czf', archive,
  'BCL-CANDIDATE.md',
  'zyngui/zynthian_gui.py',
  'zyngine/zynthian_engine_audio_mixer.py',
  'zynlibs/zynmixer/mixer.c',
  'zynlibs/zynmixer/mixer.h',
], { cwd: root, stdio: 'inherit' })
