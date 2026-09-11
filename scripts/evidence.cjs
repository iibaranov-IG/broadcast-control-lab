const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
function writeEvidence(root, passport, execution) {
  const dir = path.join(root, 'reports', passport.id)
  fs.mkdirSync(dir, { recursive: true })
  const evidence = { schemaVersion: 1, case: passport.id, source: passport.source,
    packageVersion: passport.packageVersion, verification: passport.verification, ...execution }
  fs.writeFileSync(path.join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify(passport, null, 2) + '\n')
  const text = [
    `# BCL: ${passport.title}`, '', `Result: **${execution.status}**`, '',
    `Source issue: ${passport.issue}`, '', passport.problem, '',
    `Reproduction: ${passport.reproduce}`, '', `Change: ${passport.repair}`, '',
    `Acceptance: ${passport.acceptance}`, '',
    `Upstream: ${passport.source.repository}@${passport.source.commit}`,
    `BCL revision: ${execution.bclRevision || 'unknown'}`,
    `Node: ${execution.node}`, '',
    '| Stage | Result |', '| --- | --- |',
    ...execution.stages.map(s => `| ${s.name} | ${s.status} |`), '',
    '## Automated checks', '',
    ...(execution.tests || []).map(t => `- ${t.status}: ${t.name}`), '',
    '## Build evidence', '',
    ...(execution.packages || []).map(p => `- ${p.path}: SHA-256 \`${p.sha256}\` (${p.bytes} bytes)`),
    execution.error ? `Failure: ${execution.error.replace(/[\r\n]/g, ' ')}` : '', '',
    '## Remaining owner checks', '', passport.verification.limitations, '', passport.verification.ownerCheck, '',
    `Hardware verified: ${passport.verification.hardwareVerified}. Companion UI verified: ${passport.verification.companionUiVerified}.`, '',
    'This report records automated evidence; it does not certify physical equipment.', '',
  ].join('\n')
  fs.writeFileSync(path.join(dir, 'PR-REPORT.md'), text)
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text)
  return evidence
}
function packages(root, pattern) {
  // Passport v1 packages use one directory and a filename glob, e.g. *.tgz.
  const directory = path.dirname(pattern)
  const basename = path.basename(pattern)
  const re = new RegExp('^' + basename.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$')
  const found = fs.readdirSync(path.join(root, directory)).filter(n => re.test(n)).sort()
  if (!found.length) throw new Error('Build produced no matching package')
  return found.map(name => {
    const relative = path.join(directory, name)
    const data = fs.readFileSync(path.join(root, relative))
    return { path: relative, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex') }
  })
}
module.exports = { writeEvidence, packages }
