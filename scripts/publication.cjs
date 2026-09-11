const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const hash = data => createHash('sha256').update(data).digest('hex')
const repoPattern = /^[\w.-]+\/[\w.-]+$/
function filePath(p) {
  if (typeof p !== 'string' || !p || p.startsWith('/') || /[\\\r\n\0]/.test(p) || p.split('/').some(s => !s || s === '.' || s === '..' || s === '.git')) throw new Error('Invalid publication file path')
}
function validatePublication(c) {
  if (!c.publish) return
  const p = c.publish
  if (!c.sources.some(s => s.id === p.source) || !repoPattern.test(p.target || '') || typeof p.base !== 'string' || !/^[\w][\w./-]*$/.test(p.base) || p.base.includes('..')) throw new Error('Invalid publication source, target or base')
  if (!Array.isArray(p.paths) || !p.paths.length || p.paths.length > 100 || new Set(p.paths).size !== p.paths.length) throw new Error('Publication needs distinct explicit file paths (maximum 100)')
  p.paths.forEach(filePath)
}
function regular(root, relative) {
  filePath(relative)
  let cursor = root
  for (const part of relative.split('/')) {
    cursor = path.join(cursor, part)
    if (fs.lstatSync(cursor).isSymbolicLink()) throw new Error('Publication cannot follow symlinks')
  }
  if (!fs.statSync(cursor).isFile()) throw new Error('Publication path must be a regular file')
  return fs.readFileSync(cursor)
}
function capture(root, c) {
  validatePublication(c)
  const s = c.sources.find(s => s.id === c.publish.source)
  const sourceRoot = path.join(root, s.directory)
  const git = args => execFileSync('git', ['-C', sourceRoot, ...args], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
  if (git(['rev-parse', 'HEAD']).trim() !== s.commit) throw new Error('Publication baseline changed')
  let size = 0
  const files = c.publish.paths.map(p => {
    const listed = git(['ls-tree', '-z', s.commit, '--', p]).split('\0').filter(Boolean)
    if (listed.length > 1) throw new Error('Publication paths must name individual files')
    const match = listed[0]?.match(/^(100644|100755) blob ([a-f0-9]{40})\t/)
    if (listed.length && !match) throw new Error('Unsupported baseline file type')
    const prior = match?.[2] || null
    try {
      const bytes = regular(sourceRoot, p)
      size += bytes.length
      if (size > 5 * 1024 * 1024) throw new Error('Publication exceeds 5 MiB')
      return { path: p, mode: fs.statSync(path.join(sourceRoot, p)).mode & 0o111 ? '100755' : '100644', prior, content: bytes.toString('base64') }
    } catch (error) {
      if (error.code !== 'ENOENT' || !prior) throw error
      return { path: p, mode: match[1], prior, content: null }
    }
  })
  const candidate = { schemaVersion: 1, case: c.id, source: s, publish: c.publish, files }
  return Buffer.from(JSON.stringify(candidate, null, 2) + '\n')
}
function bundle(directory, c) {
  const evidence = JSON.parse(regular(directory, 'evidence.json'))
  const snapshot = JSON.parse(regular(directory, 'case.json'))
  if (JSON.stringify(snapshot) !== JSON.stringify(c)) throw new Error('Passport changed: test this case again')
  if (evidence.case !== c.id || evidence.status !== 'PASS' || !evidence.tests?.length || evidence.tests.some(t => t.status !== 'PASS') || !/^[a-f0-9]{40}$/.test(evidence.bclRevision)) throw new Error('Publication requires passing evidence with a BCL revision')
  if (require('./selection-policy.cjs').blocked(c.publish?.target || '')) throw new Error('Publication target is denied by BCL policy')
  if (!c.upstream || evidence.qualification !== 'RED_GREEN' || evidence.upstream?.status !== 'PASS' || evidence.upstream.baseline !== 'EXPECTED_FAILURE') throw new Error('Publication requires upstream red → green evidence; contract-only checks cannot qualify')
  if (!(evidence.upstream.suiteSummary?.total > evidence.upstream.suiteSummary?.skipped)) throw new Error('Missing nonempty upstream suite summary')
  for (const [label, step, code] of [['baseline-red', c.upstream.regression, c.upstream.negative.exitCode], ['candidate-green', c.upstream.regression, 0], ['candidate-suite', c.upstream.suite, 0]]) {
    const records = evidence.upstream.commands.filter(r => r.label === label)
    if (records.length !== 1) throw new Error(`Missing or ambiguous test claim: ${label}`)
    const r = records[0]
    if (r.status !== 'PASS' || r.exitCode !== code || r.signal || r.cwd !== step.cwd || JSON.stringify(r.argv) !== JSON.stringify(step.argv) || !evidence.logs.some(l => l.path === r.log)) throw new Error(`Unsupported test claim: ${label}`)
  }
  for (const text of [c.problem, c.repair, c.reproduce, c.acceptance]) if (/(?:tests?|suite|checks?)\s+(?:all\s+)?(?:passed|succeeded)|(?:passed|green)\s+(?:focused|full|all)\s+(?:tests?|suite)/i.test(text)) throw new Error('Put test-pass claims in generated evidence, not free-form passport prose')
  for (const log of evidence.logs || []) if (hash(regular(directory, log.path)) !== log.sha256) throw new Error('Evidence log hash mismatch')
  const bytes = regular(directory, 'candidate.json')
  if (hash(bytes) !== evidence.publication?.sha256) throw new Error('Candidate hash mismatch; rerun bcl test')
  const candidate = JSON.parse(bytes)
  validatePublication(c)
  if (!c.publish || candidate.case !== c.id || JSON.stringify(candidate.publish) !== JSON.stringify(c.publish) || JSON.stringify(candidate.source) !== JSON.stringify(c.sources.find(s => s.id === c.publish.source))) throw new Error('Candidate does not match passport')
  if (JSON.stringify(candidate.files.map(f => f.path)) !== JSON.stringify(c.publish.paths)) throw new Error('Candidate paths differ from publication allowlist')
  for (const f of candidate.files) {
    filePath(f.path)
    if (!['100644', '100755'].includes(f.mode) || (f.prior !== null && !/^[a-f0-9]{40}$/.test(f.prior)) || (f.content !== null && (typeof f.content !== 'string' || Buffer.from(f.content, 'base64').toString('base64') !== f.content))) throw new Error('Malformed candidate file')
  }
  return { evidence, candidate, digest: hash(bytes) }
}
function hardwareKit(directory, c, runUrl = '') {
  const e = JSON.parse(regular(directory, 'evidence.json'))
  const text = [`# Owner check: ${c.title}`, '', `Issue: ${c.issue}`, `Automated result: ${e.status}`, runUrl ? `Evidence: ${runUrl}` : '', '',
    '## What to check', '', c.verification.ownerCheck, '', '## Expected result', '', c.acceptance, '',
    '## Scope and limits', '', c.verification.limitations, '',
    'Use a separate test setup. Keep your current configuration and working build for rollback.',
    'Stop the test and restore that build if normal operation degrades.', '',
    '## Return this report', '', 'Fill in owner-result.json and attach relevant logs to the issue. Do not include credentials.', '',
    `BCL revision: ${e.bclRevision}`, `Candidate SHA-256: ${e.publication?.sha256 || 'not captured'}`, '',
    'This kit provides case-specific manual instructions; it does not install software or control equipment automatically.', ''].join('\n')
  fs.writeFileSync(path.join(directory, 'HARDWARE-CHECK.md'), text)
  const response = path.join(directory, 'owner-result.json')
  if (!fs.existsSync(response)) fs.writeFileSync(response, JSON.stringify({ case: c.id, bclRevision: e.bclRevision, candidateSha256: e.publication?.sha256 || null, result: 'NOT_RUN', deviceModel: '', firmware: '', applicationVersion: '', steps: '', observed: '', logs: [] }, null, 2) + '\n')
  return text
}
function plan(directory, c, options) {
  const { evidence, candidate, digest } = bundle(directory, c)
  if (!repoPattern.test(options.fork || '')) throw new Error('Supply --fork owner/repo (an existing writable fork or the target repository)')
  const branch = `bcl/${c.id}-${digest.slice(0, 16)}`
  const checks = evidence.upstream.commands.filter(t => ['baseline-red', 'candidate-green', 'candidate-suite'].includes(t.label)).map(t => `- ${t.label}: ${t.status}; command: \`${t.argv.join(' ')}\`; exit: ${t.exitCode}; log: \`${t.log}\``).join('\n')
  const body = [c.problem, '', '## Change', '', c.repair, '', `Related issue: ${c.issue}`, '',
    '## Reproduction and acceptance', '', c.reproduce, '', c.acceptance, '',
    '## BCL evidence', '', `Run: ${options.run || 'Local preview; a successful Actions run is required to publish.'}`, '',
    `Artifact: \`${options.batch ? 'batch-evidence/' + c.id : c.id + '-evidence'}\``, `BCL revision: \`${evidence.bclRevision}\``,
    `Tested baseline: \`${candidate.source.repository}@${candidate.source.commit}\``,
    `Candidate SHA-256: \`${digest}\``, '', checks, '',
    '## Owner check', '', c.verification.ownerCheck, '', c.verification.limitations, '',
    `Hardware verified: ${c.verification.hardwareVerified}. Full application verified: ${c.verification.applicationVerified}.`, '',
    'The evidence artifact contains HARDWARE-CHECK.md and owner-result.json. Automated checks do not certify hardware.', '',
    `<!-- bcl:${c.id}:${digest} -->`, ''].join('\n')
  return { target: c.publish.target, fork: options.fork, base: c.publish.base, branch, title: c.title, body, candidate, digest }
}
module.exports = { validatePublication, capture, bundle, hardwareKit, plan, hash, regular }
