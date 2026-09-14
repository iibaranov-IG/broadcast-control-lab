const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execFileSync } = require('node:child_process')
const { plan } = require('./publication.cjs')

function api(method, endpoint, body) {
  return method === 'GET' ? require('./retry.cjs').retrySync(() => requestOnce(method, endpoint, body)) : requestOnce(method, endpoint, body)
}
function requestOnce(method, endpoint, body) {
  const args = ['api', '--hostname', 'github.com', '--method', method, endpoint]
  if (body !== undefined) args.push('--input', '-')
  try {
    return JSON.parse(execFileSync('gh', args, { input: body === undefined ? undefined : JSON.stringify(body), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'], timeout: 60000, maxBuffer: 12 * 1024 * 1024 }))
  } catch (cause) {
    const status = /HTTP (\d{3})/.exec(String(cause.stderr))?.[1]
    const error = new Error(`GitHub ${method} ${endpoint.split('?')[0]} failed${status ? ` (HTTP ${status})` : ''}. Check gh authentication and repository access; rerunning is safe.`)
    error.status = Number(status)
    error.cause = cause
    throw error
  }
}
function optional(api, endpoint) {
  try { return api('GET', endpoint) } catch (error) { if (error.status === 404) return null; throw error }
}
function publishPlan(p, request = api) {
  if (require('./selection-policy.cjs').blocked(p.target)) throw new Error('Publication target is denied by BCL policy')
  const target = `repos/${p.target}`, fork = `repos/${p.fork}`
  const owner = p.fork.split('/')[0]
  const head = `${owner}:${p.branch}`
  // Read access and fork relationship before creating anything.
  const targetInfo = request('GET', target)
  const forkInfo = request('GET', fork)
  if (p.fork !== p.target && forkInfo.source?.full_name !== (targetInfo.source?.full_name || targetInfo.full_name)) throw new Error('Publication repository is not in the target fork network')
  if (!forkInfo.permissions?.push) throw new Error('No write access to publication repository')
  const base = request('GET', `${target}/commits/${encodeURIComponent(p.base)}`)
  const comparison = request('GET', `${target}/compare/${p.candidate.source.commit}...${base.sha}`)
  if (!['ahead', 'identical'].includes(comparison.status)) throw new Error('Tested baseline is not an ancestor of target base; rebase and test again')
  const existingPRs = () => request('GET', `${target}/pulls?state=all&head=${encodeURIComponent(head)}&base=${encodeURIComponent(p.base)}&per_page=100`)
  const priorPRs = existingPRs()
  const marker = `<!-- bcl:${p.candidate.case}:${p.digest} -->`
  const existing = priorPRs.find(pr => pr.body?.includes(marker))
  if (existing) return { url: existing.html_url, reused: true, state: existing.state }
  if (priorPRs.length) throw new Error('Branch already has a different PR; refusing to overwrite it')
  const parent = request('GET', `${fork}/git/commits/${p.candidate.source.commit}`)
  const entries = p.candidate.files.map(f => {
    if (f.content === null) return { path: f.path, mode: f.mode, type: 'blob', sha: null }
    const blob = request('POST', `${fork}/git/blobs`, { content: f.content, encoding: 'base64' })
    return { path: f.path, mode: f.mode, type: 'blob', sha: blob.sha }
  })
  const tree = request('POST', `${fork}/git/trees`, { base_tree: parent.tree.sha, tree: entries })
  if (tree.sha !== p.candidate.tree) throw new Error('Constructed PR tree differs from the tested candidate')
  if (tree.sha === parent.tree.sha) throw new Error('Candidate contains no changes')
  const refPath = `${fork}/git/ref/heads/${p.branch}`
  let ref = optional(request, refPath)
  if (!ref) {
    const commit = request('POST', `${fork}/git/commits`, { message: p.title, tree: tree.sha, parents: [p.candidate.source.commit] })
    try { ref = request('POST', `${fork}/git/refs`, { ref: `refs/heads/${p.branch}`, sha: commit.sha }) }
    catch (error) { if (error.status !== 422) throw error; ref = request('GET', refPath) }
  }
  const headCommit = request('GET', `${fork}/git/commits/${ref.object.sha}`)
  if (headCommit.tree.sha !== tree.sha || headCommit.parents.length !== 1 || headCommit.parents[0].sha !== p.candidate.source.commit) throw new Error('Existing branch differs from tested candidate; refusing to overwrite')
  try {
    const pr = request('POST', `${target}/pulls`, { title: p.title, body: p.body, head, head_repo: p.fork.split('/')[1], base: p.base, draft: true, maintainer_can_modify: true })
    return { url: pr.html_url, reused: false, state: pr.state, headSha: ref.object.sha }
  } catch (error) {
    if (error.status !== 422) throw error
    const raced = existingPRs().find(pr => pr.body?.includes(marker))
    if (!raced) throw error
    return { url: raced.html_url, reused: true, state: raced.state }
  }
}
function parseOptions(args) {
  const options = {}
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') { options.dryRun = true; continue }
    if (args[i] === '--batch') { options.batch = true; continue }
    if (!['--fork', '--run'].includes(args[i]) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Use --fork owner/repo, --run <Actions URL>, and optionally --batch or --dry-run')
    const key = args[i].slice(2)
    if (options[key]) throw new Error('Duplicate option')
    options[key] = args[++i]
  }
  return options
}
function validateBatchManifest(manifest, id) {
  const entries = (manifest.cases || []).filter(item => item.case === id)
  if (manifest.completed !== true || entries.length !== 1 || entries[0].status !== 'PASS') throw new Error('Selected case did not pass a completed batch')
}
function publish(root, c, options) {
  let directory = path.join(root, 'reports', c.id), temporary
  try {
    if (options.run) {
      const m = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/actions\/runs\/(\d+)\/?$/.exec(options.run)
      if (!m) throw new Error('Use a GitHub Actions run URL')
      const run = api('GET', `repos/${m[1]}/actions/runs/${m[2]}`)
      if (run.status !== 'completed' || (run.conclusion !== 'success' && !(options.batch && run.conclusion === 'failure'))) throw new Error('Evidence run must be completed; only a completed batch may contain failed peers')
      temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'bcl-publish-'))
      directory = temporary
      require('./retry.cjs').retrySync(() => {
        fs.rmSync(directory, { recursive: true, force: true })
        fs.mkdirSync(directory)
        execFileSync('gh', ['run', 'download', m[2], '--repo', m[1], '--name', options.batch ? 'batch-evidence' : `${c.id}-evidence`, '--dir', directory], { stdio: 'pipe', timeout: 60000 })
      })
      if (options.batch) {
        const batchDir = path.join(temporary, 'batches')
        const files = fs.readdirSync(batchDir).filter(p => p.endsWith('.json'))
        if (files.length !== 1) throw new Error('Expected one completed batch manifest')
        const manifest = JSON.parse(require('./publication.cjs').regular(batchDir, files[0]))
        validateBatchManifest(manifest, c.id)
        directory = path.join(temporary, c.id)
      }
      const p = plan(directory, c, options)
      const e = JSON.parse(fs.readFileSync(path.join(directory, 'evidence.json')))
      if (e.bclRevision !== run.head_sha) throw new Error('Evidence revision differs from Actions run')
      return finish(p)
    }
    if (!options.dryRun) throw new Error('Publish requires --run <successful Actions URL>; use --dry-run for local evidence')
    return finish(plan(directory, c, options))
  } finally { if (temporary) fs.rmSync(temporary, { recursive: true, force: true }) }
  function finish(p) {
    const output = path.join(root, 'reports', c.id)
    fs.mkdirSync(output, { recursive: true })
    fs.writeFileSync(path.join(output, 'PUBLISH-PR.md'), p.body)
    fs.writeFileSync(path.join(output, 'publish-plan.json'), JSON.stringify({ target: p.target, fork: p.fork, base: p.base, branch: p.branch, title: p.title, candidateSha256: p.digest }, null, 2) + '\n')
    if (options.dryRun) return { preview: path.join(output, 'PUBLISH-PR.md'), branch: p.branch }
    const result = publishPlan(p)
    fs.writeFileSync(path.join(output, 'publication.json'), JSON.stringify(result, null, 2) + '\n')
    const tracking = require('./tracking.cjs')
    try {
      const db = tracking.read(root)
      tracking.register(db, c, result, p.digest, options.run)
      tracking.save(root, db)
      result.board = tracking.remoteRegister(root, c, result, p.digest, options.run, api)
    } catch (error) { result.boardPending = true; result.boardError = error.message }
    fs.writeFileSync(path.join(output, 'publication.json'), JSON.stringify(result, null, 2) + '\n')
    return result
  }
}
module.exports = { publish, publishPlan, parseOptions, api, validateBatchManifest }
