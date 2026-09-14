const fs = require('node:fs')
const path = require('node:path')
const repository = /^[A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*$/
function issueURL(url) {
  const m = /^https:\/\/github\.com\/([A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*)\/issues\/([1-9]\d*)\/?$/.exec(url || '')
  if (!m) throw new Error('Use a GitHub issue URL')
  return { repository: m[1], number: m[2], url: `https://github.com/${m[1]}/issues/${m[2]}` }
}
function options(args) {
  const result = { dependencies: [] }
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i], value = args[i + 1]
    if (!['--source', '--ref', '--dependency', '--assessment'].includes(name) || !value || value.startsWith('--')) throw new Error('Use --source owner/repo, --ref revision, --assessment file.json, or --dependency <GitHub issue/PR URL>')
    if (name === '--dependency') { reference(value); result.dependencies.push(value); continue }
    const key = name.slice(2)
    if (result[key]) throw new Error(`Duplicate ${name}`)
    result[key] = value
  }
  if (result.source && !repository.test(result.source)) throw new Error('Invalid source repository')
  if (result.ref && (!/^[\w][\w./-]*$/.test(result.ref) || result.ref.includes('..'))) throw new Error('Invalid source revision')
  if (result.dependencies.length > 10) throw new Error('At most ten explicit dependency references')
  return result
}
function reference(url) {
  const m = /^https:\/\/github\.com\/([A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*)\/(issues|pull)\/([1-9]\d*)$/.exec(url || '')
  if (!m) throw new Error('Dependency must be a canonical GitHub issue/PR URL')
  return { repo: m[1], kind: m[2], number: m[3], url }
}
const buildNames = new Map([
  ['CMakeLists.txt', 'cpp-cmake'], ['configure.ac', 'cpp-autotools'], ['configure.in', 'cpp-autotools'],
  ['package.json', 'node'], ['pyproject.toml', 'python'], ['setup.py', 'python'],
  ['Makefile', 'make'], ['Cargo.toml', 'rust'], ['go.mod', 'go'],
])
const sourcePattern = /\.(c|cc|cpp|cxx|h|hpp|py|js|mjs|cjs|ts|tsx|rs|go)$/i
const nonRegistryDependency = /(git\+|git:\/\/|github:|git@github|https?:\/\/github\.com\/[^\s"']+\.git|(?:file|workspace):)/i
function packageDependencyText(pkg) {
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies', 'resolutions', 'overrides']
  return sections.flatMap(name => Object.values(pkg?.[name] || {})).map(value => typeof value === 'string' ? value : JSON.stringify(value)).join('\n')
}
function mentions(text, issue, sameRepo) {
  const full = `${issue.repository}#${issue.number}`
  if (String(text).includes(issue.url) && new RegExp(`${issue.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d)`).test(text)) return true
  if (new RegExp(`(^|[^A-Za-z0-9_.\\/-])${full.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?!\\d)`, 'i').test(text)) return true
  return sameRepo && new RegExp(`(^|[\\s(])#${issue.number}(?!\\d)`).test(text || '')
}
async function inspect(url, opts = {}, request = require('./github-read.cjs').reader()) {
  const issue = issueURL(url)
  opts = { dependencies: [], ...opts }
  if (opts.source && !repository.test(opts.source)) throw new Error('Invalid source repository')
  const report = { schemaVersion: 1, checkedAt: new Date().toISOString(), issue: { ...issue }, source: { repository: opts.source || issue.repository, requestedRef: opts.ref || null }, findings: [], relatedPRs: [], dependencies: [], errors: [], scope: { cloned: false, built: false, reproduced: false, maxPages: 5, maxRelatedPRs: 20 }, coverage: {} }
  const finding = (code, severity, detail, link) => report.findings.push({ code, severity, detail, url: link })
  async function read(endpoint, label) {
    try { return await request(endpoint) }
    catch (e) { report.errors.push({ check: label, url: `https://api.github.com/${endpoint}`, status: e.httpStatus || e.status || null, message: e.message }); return null }
  }
  async function list(endpoint, label) {
    const items = []
    for (let page = 1; page <= 5; page++) {
      const batch = await read(`${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`, label)
      if (!Array.isArray(batch)) { report.coverage[label] = 'incomplete'; return items }
      items.push(...batch)
      if (batch.length < 100) { report.coverage[label] = 'complete'; return items }
    }
    report.coverage[label] = 'limited'
    finding('SEARCH_LIMIT', 'question', `${label}: stopped after 500 entries; absence of a related PR is not established.`, `https://api.github.com/${endpoint}`)
    return items
  }
  const info = await read(`repos/${issue.repository}/issues/${issue.number}`, 'issue')
  if (info?.pull_request) throw new Error('This URL identifies a PR; supply an issue')
  if (info) {
    Object.assign(report.issue, { title: info.title, state: info.state, updatedAt: info.updated_at })
    if (info.state === 'closed') finding('ISSUE_CLOSED', 'defer', 'Issue is closed; confirm a remaining problem before starting another repair.', issue.url)
    if (!info.body?.trim()) finding('NO_DESCRIPTION', 'question', 'Issue has no description; obtain reproduction steps.', issue.url)
  }
  const source = report.source.repository
  const repo = await read(`repos/${source}`, 'source-repository')
  if (repo) {
    report.source.defaultBranch = repo.default_branch
    report.source.archived = repo.archived
    report.source.license = repo.license?.spdx_id || null
    if (repo.archived || repo.disabled) finding('REPOSITORY_INACTIVE', 'defer', 'Source repository is archived or disabled; establish a maintained destination.', `https://github.com/${source}`)
    const revision = opts.ref || repo.default_branch
    const commit = await read(`repos/${source}/commits/${encodeURIComponent(revision)}`, 'source-revision')
    if (commit) {
      report.source.commit = commit.sha
      const tree = await read(`repos/${source}/git/trees/${commit.commit.tree.sha}?recursive=1`, 'source-tree')
      if (tree?.tree) {
        report.coverage.sourceTree = tree.truncated ? 'limited' : 'complete'
        const paths = tree.tree.filter(e => e.type === 'blob').map(e => e.path)
        report.source.licenseMissing = !tree.truncated && repo.license === null && !paths.some(p => /(^|\/)(licen[cs]e|copying)(\.|$)/i.test(p))
        report.source.ruleFiles = paths.filter(p => /(^|\/)(AGENTS\.md|CONTRIBUTING(?:\.md)?|PULL_REQUEST_TEMPLATE(?:\.md)?)$/i.test(p) || /^\.github\/PULL_REQUEST_TEMPLATE\//i.test(p)).map(p => ({ path: p, url: `https://github.com/${source}/blob/${commit.sha}/${p}` }))
        if (report.source.ruleFiles.length > 20) finding('RULE_READ_LIMIT', 'question', 'More than twenty rule files; review remaining scopes before work.', `https://github.com/${source}`)
        for (const rule of report.source.ruleFiles.slice(0, 20)) {
          const item = await read(`repos/${source}/contents/${rule.path}?ref=${commit.sha}`, `rules:${rule.path}`)
          if (!item || item.encoding !== 'base64' || item.size > 131072 || !item.content) { finding('RULE_UNREAD', 'question', `Could not read ${rule.path} within the metadata limit.`, rule.url); continue }
          rule.content = Buffer.from(item.content, 'base64').toString('utf8')
          rule.requirementHints = rule.content.split('\n').filter(line => /must|required|before|commit|test|sign.off|DCO|pull request|comment/i.test(line)).slice(0, 50)
          rule.reviewStatus = 'HUMAN_REVIEW_REQUIRED'
        }
        report.source.codeExamples = paths.filter(p => sourcePattern.test(p) && !/^(docs|vendor|node_modules)\//.test(p)).slice(0, 10)
        report.source.buildFiles = paths.filter(p => buildNames.has(path.posix.basename(p))).slice(0, 30).map(p => ({ path: p, kind: buildNames.get(path.posix.basename(p)), url: `https://github.com/${source}/blob/${commit.sha}/${p}` }))
        if (tree.truncated) finding('TREE_LIMIT', 'question', 'GitHub returned a truncated tree; file absence cannot be inferred.', `https://github.com/${source}/tree/${commit.sha}`)
        if (!report.source.codeExamples.length) finding('NO_SOURCE_IDENTIFIED', 'question', 'No supported source-file types identified. This may be an issue tracker or use another language; specify --source if needed.', `https://github.com/${source}`)
        if (!report.source.buildFiles.length) finding('NO_BUILD_RECIPE', 'question', 'No recognized build manifest found; the build procedure needs review.', `https://github.com/${source}`)
        if (tree.tree.some(e => e.type === 'commit') || paths.includes('.gitmodules')) finding('SUBMODULES', 'question', 'Source uses submodules. Their availability and exact revisions need a separate dependency check.', `https://github.com/${source}/tree/${commit.sha}`)
        // Bounded manifest reads: metadata only, never package installation.
        for (const name of ['package.json', 'requirements.txt', 'pyproject.toml']) {
          if (!paths.includes(name)) continue
          const item = await read(`repos/${source}/contents/${name}?ref=${commit.sha}`, `manifest:${name}`)
          if (!item) continue
          if (item.size > 131072 || item.encoding !== 'base64' || !item.content) { finding('MANIFEST_UNREAD', 'question', `${name} is unavailable inline or exceeds the metadata limit.`, `https://github.com/${source}/blob/${commit.sha}/${name}`); continue }
          const body = Buffer.from(item.content, 'base64').toString('utf8')
          const link = `https://github.com/${source}/blob/${commit.sha}/${name}`
          if (name === 'package.json') {
            try {
              const pkg = JSON.parse(body)
              report.source.nodeScripts = Object.keys(pkg.scripts || {})
              report.source.nodeDependencyCount = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).length
              if (nonRegistryDependency.test(packageDependencyText(pkg))) finding('NONREGISTRY_DEPENDENCIES', 'question', `${name} references Git/local/workspace dependencies; resolve them before scheduling a build.`, link)
            }
            catch { finding('INVALID_MANIFEST', 'question', 'package.json could not be parsed.', link) }
          } else if (nonRegistryDependency.test(body)) finding('NONREGISTRY_DEPENDENCIES', 'question', `${name} references Git/local/workspace dependencies; resolve them before scheduling a build.`, link)
        }
      }
    }
  }
  const references = new Map()
  if (info) {
    const timeline = await list(`repos/${issue.repository}/issues/${issue.number}/timeline`, 'issueTimeline')
    for (const event of timeline) {
      const linked = event.source?.issue
      if (linked?.pull_request && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+\/pull\/[1-9]\d*$/.test(linked.html_url || '')) references.set(linked.html_url, 'issue timeline cross-reference')
    }
    for (const prRepo of new Set([issue.repository, source])) {
      const pulls = await list(`repos/${prRepo}/pulls?state=open`, `openPRs:${prRepo}`)
      for (const pr of pulls) if (mentions(`${pr.title || ''}\n${pr.body || ''}`, issue, prRepo === issue.repository) && pr.html_url) references.set(pr.html_url, 'open PR explicitly mentions issue')
    }
    for (const match of (info.body || '').matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/([1-9]\d*)\b/g)) references.set(match[0], 'PR link in issue description; relationship needs review')
  }
  if (references.size > 20) finding('PR_LIMIT', 'question', 'More than twenty referenced PRs; remaining references were not inspected.', issue.url)
  for (const [url, relation] of [...references].slice(0, 20)) {
    let ref
    try { ref = reference(url) } catch { continue }
    const pr = await read(`repos/${ref.repo}/pulls/${ref.number}`, `relatedPR:${url}`)
    if (pr) report.relatedPRs.push({ url, relation, title: pr.title, author: pr.user?.login, state: pr.state, draft: Boolean(pr.draft), merged: Boolean(pr.merged_at), headSha: pr.head?.sha, updatedAt: pr.updated_at })
  }
  for (const url of opts.dependencies) {
    const ref = reference(url)
    const item = await read(`repos/${ref.repo}/${ref.kind === 'pull' ? 'pulls' : 'issues'}/${ref.number}`, `dependency:${url}`)
    if (!item) continue
    report.dependencies.push({ url, state: item.state, merged: ref.kind === 'pull' ? Boolean(item.merged_at) : null })
    if (item.state === 'open' || (ref.kind === 'pull' && !item.merged_at)) finding('DEPENDENCY_UNRESOLVED', 'defer', 'An explicitly declared dependency remains open or its PR was closed without merge. Confirm an alternative before building.', url)
  }
  if (report.relatedPRs.some(pr => pr.state === 'open')) finding('ACTIVE_RELATED_PR', 'question', 'A related PR is active. Review its scope: help validate it or identify a distinct repair; do not assume it already solves this issue.', issue.url)
  if (report.errors.length) finding('READ_INCOMPLETE', 'question', 'Some GitHub reads failed. Unavailable data is not evidence that source or related PRs do not exist.', issue.url)
  report.decision = report.findings.some(f => f.severity === 'defer') ? 'DEFER' : report.findings.some(f => f.severity === 'question') ? 'NEEDS_INFO' : 'READY_TO_INVESTIGATE'
  report.nextActions = report.findings.filter(f => f.severity !== 'info').map(f => f.detail)
  if (!report.nextActions.length) report.nextActions.push('Review the reported behavior and build instructions; define the baseline failure before cloning or scheduling a build.')
  report.limitations = ['READY_TO_INVESTIGATE means metadata is sufficient to begin engineering review, not a reproduced or repaired bug.', 'Dependency manifests are scanned heuristically; transitive dependencies, availability of registry packages, native libraries and physical equipment are not verified.', 'Only explicit PR references are matched; semantically related work without links can be missed.', 'Runtime compatibility, contribution policy and complete reproduction steps still require engineering review.']
  return report
}
function markdown(r) {
  const clean = s => String(s || '').replace(/[\r\n]/g, ' ')
  return [`# BCL triage: ${clean(r.issue.title || r.issue.url)}`, '', `Decision: **${r.decision}**`, `Checked: ${r.checkedAt}`, `Issue: ${r.issue.url}`, `Source: ${r.source.repository}`, `Revision: ${r.source.commit || 'unresolved'}`, '', '## Findings', '', ...r.findings.map(f => `- **${f.code}** (${f.severity}): ${clean(f.detail)} [Source](${f.url})`), ...(r.findings.length ? [] : ['No metadata blocker found within the stated coverage.']), '', '## Related PRs', '', ...r.relatedPRs.map(p => `- [${clean(p.title)}](${p.url}) — ${p.merged ? 'merged' : p.state}${p.draft ? ', draft' : ''}; author: ${clean(p.author)}; ${p.relation}`), '', '## Next actions', '', ...r.nextActions.map(a => `- ${clean(a)}`), '', '## Read errors', '', ...r.errors.map(e => `- ${e.check}: ${clean(e.message)} — ${e.url}`), '', '## Limits', '', ...r.limitations.map(l => `- ${l}`), '', 'No clone, build, test execution, PR or owner message was performed.', ''].join('\n')
}
const resolvableFindings = new Set(['SUBMODULES', 'NO_BUILD_RECIPE', 'ACTIVE_RELATED_PR'])
function applyResolutions(report, assessment = {}) {
  for (const [code, item] of Object.entries(assessment.resolutions || {})) {
    if (!resolvableFindings.has(code)) throw new Error(`Finding ${code} cannot be resolved by assessment`)
    if (!item?.reason?.trim() || !Array.isArray(item.evidence) || !item.evidence.length || item.evidence.some(value => typeof value !== 'string' || !value.trim())) throw new Error(`Resolution ${code} needs a reason and evidence`)
    const finding = report.findings.find(value => value.code === code && value.severity === 'question')
    if (!finding) throw new Error(`Resolution ${code} does not match an open finding`)
    finding.severity = 'info'
    finding.resolution = { reason: item.reason, evidence: item.evidence }
    finding.detail += ` Resolved for this revision: ${item.reason}`
  }
  report.decision = report.findings.some(f => f.severity === 'defer') ? 'DEFER' : report.findings.some(f => f.severity === 'question') ? 'NEEDS_INFO' : 'READY_TO_INVESTIGATE'
  report.nextActions = report.findings.filter(f => f.severity !== 'info').map(f => f.detail)
  if (!report.nextActions.length) report.nextActions.push('Review the reported behavior and build instructions; define the baseline failure before cloning or scheduling a build.')
  return report
}
async function run(root, url, args = [], request = require('./github-read.cjs').reader()) {
  const begin = Date.now(), opts = options(args)
  const report = await inspect(url, opts, request)
  const policyFile = path.join(root, 'selection-policy.json')
  const policy = fs.existsSync(policyFile) ? JSON.parse(fs.readFileSync(policyFile)) : {}
  const assessment = opts.assessment ? JSON.parse(fs.readFileSync(opts.assessment)) : {}
  applyResolutions(report, assessment)
  report.ranking = require('./selection-policy.cjs').evaluate(report, assessment, policy)
  if (report.ranking.exclusions.length) report.decision = 'REJECT'
  report.durationMs = Date.now() - begin
  const directory = path.join(root, 'reports', 'triage', ...report.issue.repository.split('/'), report.issue.number)
  fs.mkdirSync(directory, { recursive: true })
  fs.writeFileSync(path.join(directory, 'triage.json'), JSON.stringify(report, null, 2) + '\n')
  fs.writeFileSync(path.join(directory, 'TRIAGE.md'), markdown(report) + '\n## Candidate ranking\n\n' + JSON.stringify(report.ranking, null, 2) + '\n')
  return { decision: report.decision, report: path.join(directory, 'TRIAGE.md'), data: path.join(directory, 'triage.json') }
}
module.exports = { options, issueURL, mentions, inspect, markdown, applyResolutions, run }
