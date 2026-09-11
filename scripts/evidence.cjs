const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const hash = data => createHash('sha256').update(data).digest('hex')
function writeEvidence(root, passport, execution) {
  const dir = path.join(root, 'reports', passport.id)
  fs.mkdirSync(dir, { recursive: true })
  const logs = []
  const reportPath = passport.artifacts?.report && path.join(root, passport.artifacts.report)
  if (reportPath && fs.existsSync(reportPath)) {
    const data = fs.readFileSync(reportPath)
    fs.writeFileSync(path.join(dir, 'test-report.json'), data)
    logs.push({ path: 'test-report.json', bytes: data.length, sha256: hash(data) })
    try {
      let count = 0
      function transcripts(value) {
        if (!value || typeof value !== 'object') return
        for (const [key, child] of Object.entries(value)) {
          if (key === 'transcript' && Array.isArray(child)) {
            const name = `exchange-${++count}.json`
            const bytes = Buffer.from(JSON.stringify(child, null, 2) + '\n')
            fs.writeFileSync(path.join(dir, name), bytes)
            logs.push({ path: name, bytes: bytes.length, sha256: hash(bytes) })
          } else transcripts(child)
        }
      }
      transcripts(JSON.parse(data))
    } catch { /* The runner reports malformed test JSON as FAIL. Preserve the bytes. */ }
  }
  const evidence = { schemaVersion: 2, case: passport.id, sources: passport.sources,
    packageVersion: passport.packageVersion || null, verification: passport.verification, ...execution, logs }
  fs.writeFileSync(path.join(dir, 'evidence.json'), JSON.stringify(evidence, null, 2) + '\n')
  fs.writeFileSync(path.join(dir, 'case.json'), JSON.stringify(passport, null, 2) + '\n')
  const text = [
    `# BCL: ${passport.title}`, '', `Result: **${execution.status}**`, '',
    `Source issue: ${passport.issue}`, '', passport.problem, '',
    `Reproduction: ${passport.reproduce}`, '', `Change: ${passport.repair}`, '',
    `Acceptance: ${passport.acceptance}`, '',
    ...(passport.sources || []).map(s => `Source ${s.id}: ${s.repository}@${s.commit}`),
    `BCL revision: ${execution.bclRevision || 'unknown'}`,
    `Environment: ${JSON.stringify(execution.environment || {})}`,
    `Total duration: ${execution.durationMs ?? 'unknown'} ms`, '',
    '| Stage | Result | Duration (ms) |', '| --- | --- | --- |',
    ...execution.stages.map(s => `| ${s.name} | ${s.status} | ${s.durationMs ?? 'unknown'} |`), '',
    '## Automated checks', '',
    ...(execution.tests || []).map(t => `- ${t.status}: ${t.name} (${t.durationMs ?? 'unmeasured'} ms)`), '',
    '## Artifacts and hashes', '',
    ...[...(execution.packages || []), ...logs].map(p => `- ${p.path}: SHA-256 \`${p.sha256}\` (${p.bytes} bytes)`),
    execution.error ? `Failure: ${execution.error.replace(/[\r\n]/g, ' ')}` : '', '',
    '## Remaining owner checks', '', passport.verification.limitations, '', passport.verification.ownerCheck, '',
    `Hardware verified: ${passport.verification.hardwareVerified}. Full application verified: ${passport.verification.applicationVerified}.`, '',
    'Automated evidence does not certify physical equipment.', '',
  ].join('\n')
  fs.writeFileSync(path.join(dir, 'PR-REPORT.md'), text)
  return evidence
}
function packages(root, pattern, required = true) {
  const directory = path.dirname(pattern), basename = path.basename(pattern)
  const re = new RegExp('^' + basename.split('*').map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$')
  const found = fs.existsSync(path.join(root, directory)) ? fs.readdirSync(path.join(root, directory)).filter(n => re.test(n)).sort() : []
  if (required && !found.length) throw new Error('Build produced no matching package')
  return found.map(name => {
    const relative = path.join(directory, name), filename = path.join(root, relative)
    if (!fs.lstatSync(filename).isFile() || !fs.realpathSync(filename).startsWith(fs.realpathSync(root) + path.sep)) throw new Error('Package must be a regular file inside the workspace')
    const data = fs.readFileSync(filename)
    return { path: relative, bytes: data.length, sha256: hash(data) }
  })
}
module.exports = { writeEvidence, packages }
