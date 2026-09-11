const weights = { ownerPain: 12, freshness: 6, ownerAvailability: 12, resultClarity: 10, reproducibility: 12, repairSize: 7, verificationCost: 7, regressionRisk: 8, projectActivity: 7, communityValue: 7, reuse: 6, cascade: 6 }
const gates = ['allowedProject', 'nonSecurity', 'organicIssue', 'sourceAvailable', 'licenseAvailable', 'unclaimed', 'resourcesAvailable', 'externalChangesWelcome']
function blocked(repository, policy = {}) {
  const repo = repository.toLowerCase()
  return ['bitfocus', ...(policy.deniedOwners || [])].some(o => repo.split('/')[0] === o.toLowerCase()) || (policy.deniedRepositories || []).some(r => repo === r.toLowerCase())
}
function evaluate(report, assessment = {}, policy = {}) {
  if (assessment.issue && assessment.issue !== report.issue.url) throw new Error('Assessment issue mismatch')
  if (assessment.sourceCommit && assessment.sourceCommit !== report.source.commit) throw new Error('Assessment source revision is stale')
  const exclusions = []
  if (blocked(report.issue.repository, policy) || blocked(report.source.repository, policy)) exclusions.push('Project is on the publication/selection denylist')
  if (report.relatedPRs.some(p => p.state === 'open')) exclusions.push('An active related PR already occupies this issue; competition must be resolved before selection')
  if (report.source.licenseMissing === true) exclusions.push('No license identified in a complete source tree or repository metadata')
  const unknownGates = []
  for (const key of gates) {
    const item = assessment.gates?.[key]
    if (!item || item.status === 'UNKNOWN') { unknownGates.push(key); continue }
    if (!['PASS', 'REJECT'].includes(item.status) || !item.reason?.trim() || !item.evidence?.length || item.evidence.some(v => typeof v !== 'string' || !v.trim())) throw new Error(`Gate ${key} needs a status, reason and evidence`)
    if (item.status === 'REJECT') exclusions.push(`${key}: ${item.reason}`)
  }
  let earned = 0, unknownWeight = 0
  const dimensions = Object.entries(weights).map(([key, weight]) => {
    const item = assessment.dimensions?.[key]
    if (!item) { unknownWeight += weight; return { key, weight, value: null } }
    if (!Number.isInteger(item.value) || item.value < 0 || item.value > 5 || !item.reason?.trim() || !item.evidence?.length) throw new Error(`Score ${key} needs 0..5, reason and evidence`)
    earned += weight * item.value / 5
    return { key, weight, ...item }
  })
  const score = unknownWeight ? null : Math.round(earned)
  const d = assessment.delivery
  let deliveryReadiness = null
  if (d) {
    const keys = ['ownerContact', 'acceptancePath', 'validationAccess']
    if (keys.some(k => !Number.isInteger(d[k]) || d[k] < 0 || d[k] > 5) || !d.evidence?.length || !d.reason?.trim()) throw new Error('Delivery readiness requires three 0..5 assessments with evidence')
    deliveryReadiness = Math.round((d.ownerContact * 0.35 + d.acceptancePath * 0.4 + d.validationAccess * 0.25) * 20)
  }
  const binding = Boolean(assessment.issue === report.issue.url && assessment.sourceCommit && assessment.sourceCommit === report.source.commit)
  const assessed = !exclusions.length && !unknownGates.length && binding && report.decision === 'READY_TO_INVESTIGATE' && score !== null && deliveryReadiness !== null
  const eligible = assessed && score >= 70
  return { exclusions, unknownGates, assessmentBoundToRevision: binding, eligible, score, scoreRange: [Math.floor(earned), Math.ceil(earned + unknownWeight)], dimensions,
    class: exclusions.length ? 'REJECT' : !assessed ? 'NEEDS_REVIEW' : score >= 85 ? 'TAKE_NOW' : score >= 70 ? 'QUICK_REVIEW' : score >= 50 ? 'RESERVE' : 'SKIP',
    deliveryReadiness, deliveryProbability: null, deliveryNote: 'Readiness is an evidence-based human assessment, not a calibrated probability. Unknown inputs are never scored as facts.',
    queueKey: eligible && score >= 70 ? [deliveryReadiness, score] : null,
    selectable: eligible && score >= 70 }
}
module.exports = { weights, gates, blocked, evaluate }
