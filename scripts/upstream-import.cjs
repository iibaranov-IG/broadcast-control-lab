const fs = require('node:fs')
const path = require('node:path')
const { regular, hash } = require('./publication.cjs')
function run(root, c, filename) {
  const origin = path.dirname(path.resolve(filename))
  const input = JSON.parse(regular(origin, path.basename(filename)))
  const directory = path.join(root, 'reports', c.id)
  const evidence = JSON.parse(regular(directory, 'evidence.json'))
  if (input.schemaVersion !== 1 || input.case !== c.id || !input.candidateSha256 || input.candidateSha256 !== evidence.publication?.sha256 || hash(regular(directory, 'candidate.json')) !== input.candidateSha256 || JSON.stringify(input.sources) !== JSON.stringify(c.sources)) throw new Error('External evidence must match the exact case, source revisions and captured candidate')
  if (!input.environment || !Object.keys(input.environment).length || !input.runUrl || !Array.isArray(input.commands) || !input.commands.length) throw new Error('External report needs environment, provenance and commands')
  const checked = input.commands.map((command, i) => {
    if (!Array.isArray(command.argv) || !command.argv.length || command.argv.some(a => typeof a !== 'string' || !a) || !Number.isInteger(command.exitCode) || !Number.isFinite(command.durationMs) || command.durationMs < 0 || typeof command.cwd !== 'string') throw new Error('Invalid external command record')
    const bytes = regular(origin, command.log)
    if (hash(bytes) !== command.sha256) throw new Error('External log hash mismatch')
    return { command, bytes, name: `external-${i + 1}-${hash(bytes).slice(0, 16)}.log` }
  })
  const imported = { ...input, origin: 'EXTERNAL_REPORTED', importedAt: new Date().toISOString(), commands: checked.map(x => ({ ...x.command, log: x.name })) }
  for (const x of checked) fs.writeFileSync(path.join(directory, x.name), x.bytes)
  const bytes = Buffer.from(JSON.stringify(imported, null, 2) + '\n')
  fs.writeFileSync(path.join(directory, 'external-upstream.json'), bytes)
  evidence.logs = [...(evidence.logs || []).filter(l => !l.path.startsWith('external-')), ...checked.map(x => ({ path: x.name, sha256: hash(x.bytes), bytes: x.bytes.length })), { path: 'external-upstream.json', sha256: hash(bytes), bytes: bytes.length }]
  evidence.externalUpstream = { origin: 'EXTERNAL_REPORTED', report: 'external-upstream.json', candidateSha256: input.candidateSha256 }
  fs.writeFileSync(path.join(directory, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
  const reportPath = path.join(directory, 'PR-REPORT.md')
  if (fs.existsSync(reportPath)) fs.appendFileSync(reportPath, '\nExternal upstream logs imported: external-upstream.json. These are externally reported results bound to the candidate; they do not replace BCL red → green qualification.\n')
  return { imported: checked.length, origin: 'EXTERNAL_REPORTED', qualification: evidence.qualification || 'UNCHANGED' }
}
module.exports = { run }
