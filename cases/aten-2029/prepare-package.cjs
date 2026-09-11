const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const root = path.resolve(process.argv[2] || 'sources/aten')
const passport = require('../../scripts/case.cjs').load('aten-2029')
const source = passport.source
const revision = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
if (revision !== source.commit) throw new Error('Unexpected upstream revision')
const actions = fs.readFileSync(path.join(root, 'actions.js'), 'utf8')
if (actions.trimEnd() !== fs.readFileSync(path.join(__dirname, 'upstream.mjs'), 'utf8').trimEnd()) throw new Error('Upstream actions differ from tested baseline')
fs.copyFileSync(path.join(__dirname, 'candidate.mjs'), path.join(root, 'actions.js'))
for (const filename of ['package.json', 'companion/manifest.json']) {
  const target = path.join(root, filename)
  const data = JSON.parse(fs.readFileSync(target, 'utf8'))
  data.version = passport.packageVersion
  fs.writeFileSync(target, JSON.stringify(data, null, 2) + '\n')
}
fs.writeFileSync(path.join(root, 'BCL-CANDIDATE.md'), 'Community test build for ATEN request #2029. Not an official Bitfocus release.\nHardware and full Companion UI validation pending.\nSource and evidence: https://github.com/iibaranov-IG/broadcast-control-lab/tree/main/cases/aten-2029\n')
