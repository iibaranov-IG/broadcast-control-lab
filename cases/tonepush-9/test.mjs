import fs from 'node:fs'
import path from 'node:path'

const source = process.argv[2]
const read = file => fs.readFileSync(path.join(source, file), 'utf8')
const profile = read('crates/hx-proto/src/lib.rs')
const cli = read('crates/tonepush-cli/src/main.rs')
const gui = read('crates/tonepush-gui/src/lib.rs')
const backup = read('crates/hx-catalog/src/hxb.rs')
const checks = [
  ['HX Effects declares four presets per bank', /HX_EFFECTS[\s\S]*?presets_per_bank: 4/.test(profile)],
  ['CLI resolves labels through the connected device profile', cli.includes('session.profile.slot_label(index)') && cli.includes('slot(&session.profile, index)')],
  ['GUI resolves labels through the active device profile', gui.includes('profile.slot_label(slot)')],
  ['offline backups recover bank geometry from stored device ids', backup.includes('profile.presets_per_bank') && backup.includes('slot_label_for(self.index as i64, self.presets_per_bank)')],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/tonepush-9.json', JSON.stringify({ hardwareVerified: false, applicationVerified: false, results }, null, 2) + '\n')
if (results.some(result => result.status !== 'PASS')) process.exit(1)
