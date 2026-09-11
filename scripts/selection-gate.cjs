const fs = require('node:fs')
const path = require('node:path')
const { createHash } = require('node:crypto')
const hash = b => createHash('sha256').update(b).digest('hex')
function check(report, c, { publishing = false, now = Date.now() } = {}) {
  const source = c.sources.find(s => s.id === (c.upstream?.source || c.publish?.source)) || c.sources[0]
  if (report.issue?.url !== c.issue || report.source?.repository !== source.repository || report.source?.commit !== source.commit) throw new Error('Triage does not match the issue and pinned source')
  const checked = Date.parse(report.checkedAt)
  if (!Number.isFinite(checked) || checked > now + 300000) throw new Error('Invalid triage timestamp')
  if (require('./selection-policy.cjs').blocked(source.repository) || require('./selection-policy.cjs').blocked(c.publish?.target || '')) throw new Error('Selection target is denied')
  if (c.selection?.purpose === 'EXISTING_PR_VALIDATION') {
    if (publishing) throw new Error('Existing-PR validation cannot authorize a new publication')
    if (report.errors?.length || report.source.licenseMissing || !c.selection.reason?.trim() || !report.relatedPRs?.some(pr => pr.url === c.selection.existingPR)) throw new Error('Existing-PR validation needs readable source/license metadata and an explicitly linked PR')
    return report
  }
  if (report.decision !== 'READY_TO_INVESTIGATE' || !report.ranking?.eligible || !report.ranking.assessmentBoundToRevision || report.ranking.score < 70 || report.ranking.exclusions?.length || report.ranking.unknownGates?.length) throw new Error('Triage has not approved this repair for selection')
  if (publishing && now - checked > 7 * 86400000) throw new Error('Refresh triage before publication: approval is older than seven days')
  return report
}
function load(root, c, options) {
  if (!c.selection?.report || !/^[a-f0-9]{64}$/.test(c.selection.sha256 || '')) throw new Error('Case requires a pinned approved triage report')
  const bytes = require('./publication.cjs').regular(root, c.selection.report)
  if (hash(bytes) !== c.selection.sha256) throw new Error('Triage report hash changed; review and bind it again')
  const report = check(JSON.parse(bytes), c, options)
  const policyPath = path.join(root, 'selection-policy.json')
  const policy = fs.existsSync(policyPath) ? JSON.parse(fs.readFileSync(policyPath)) : {}
  if (require('./selection-policy.cjs').blocked(report.source.repository, policy) || require('./selection-policy.cjs').blocked(c.publish?.target || '', policy)) throw new Error('Selection target is denied by current policy')
  return { report, bytes }
}
module.exports = { check, load, hash }
