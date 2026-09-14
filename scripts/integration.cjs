// Read dependency metadata; never execute Makefiles, package scripts or submodules.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const hash = x => require('node:crypto').createHash('sha256').update(x).digest('hex')
function scan(directory) {
  const root = fs.realpathSync(directory), pins = [], unresolved = []
  let files = 0
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || ['.git', 'node_modules', 'output', '.cache'].includes(entry.name)) continue
      const full = path.join(dir, entry.name), relative = path.relative(root, full)
      if (++files > 100000) throw new Error('Dependency scan file limit exceeded')
      if (entry.isDirectory()) { walk(full); continue }
      if (!entry.isFile() || !(entry.name.endsWith('.mk') || ['package-lock.json', '.gitmodules'].includes(entry.name))) continue
      if (entry.name === '.gitmodules') {
        // Gitlink object IDs, rather than branch hints in .gitmodules, are the pins.
        const rows = execFileSync('git', ['-C', root, 'ls-files', '--stage', '-z'], { encoding: 'utf8', maxBuffer: 16e6 }).split('\0')
        for (const row of rows) {
          const m = /^160000 ([a-f0-9]{40}) 0\t(.+)$/.exec(row)
          if (m) pins.push({ kind: 'submodule', name: m[2], version: m[1], file: relative, provenance: 'git-index' })
        }
        continue
      }
      if (fs.statSync(full).size > 16e6) throw new Error(`Manifest too large: ${relative}`)
      const bytes = fs.readFileSync(full), text = bytes.toString(), sha256 = hash(bytes)
      if (entry.name === 'package-lock.json') {
        const lock = JSON.parse(text)
        if (!lock.packages) { unresolved.push({ file: relative, reason: 'Only npm lockfile v2/v3 packages are supported' }); continue }
        for (const [name, p] of Object.entries(lock.packages)) if (name && p.version) pins.push({ kind: 'npm', name, version: p.version, resolved: p.resolved || null, integrity: p.integrity || null, file: relative, sha256 })
      } else {
        const values = new Map()
        for (const line of text.split('\n')) {
          const m = /^\s*([A-Z0-9_]+_(?:VERSION|SITE))\s*(?::=|=)\s*([^#\r]*?)(?:\s*#.*)?$/.exec(line)
          if (m) values.set(m[1], m[2].trim())
        }
        for (const [key, value] of values) if (key.endsWith('_VERSION')) {
          const name = key.slice(0, -8), site = values.get(name + '_SITE') || null
          if (!value || /[$\\]/.test(value)) unresolved.push({ file: relative, name, reason: 'Computed or multiline version requires review', expression: value })
          else pins.push({ kind: 'buildroot', name, version: value, repository: site, file: relative, sha256 })
        }
      }
    }
  }
  walk(root)
  return { schemaVersion: 1, root, pins, unresolved, limitations: ['Static inventory; conditional Make assignments require review.', 'No recursive downloads or upstream code execution.', 'npm versions alone do not establish whether a source fix is included.'] }
}
function assess(input) {
  if (input.schemaVersion !== 1 || !input.repository || !input.productPin) throw new Error('Expected schemaVersion, local repository and productPin')
  for (const key of ['productPin', 'fixCommit', 'candidateCommit']) if (!/^[a-f0-9]{40}$/.test(input[key] || '')) throw new Error(`${key} must be a full commit ID`)
  const repo = fs.realpathSync(input.repository)
  const git = args => execFileSync('git', ['--no-replace-objects', '-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 })
  for (const key of ['productPin', 'fixCommit', 'candidateCommit']) git(['cat-file', '-e', input[key] + '^{commit}'])
  if (git(['rev-parse', '--is-shallow-repository']).trim() !== 'false') throw new Error('Complete history required; shallow ancestry is inconclusive')
  function contains(commit, ancestor) {
    try { git(['merge-base', '--is-ancestor', ancestor, commit]); return true }
    catch (e) { if (e.status === 1) return false; throw e }
  }
  const currentContainsFix = contains(input.productPin, input.fixCommit)
  const candidateContainsFix = contains(input.candidateCommit, input.fixCommit)
  const candidateDescendsFromPin = contains(input.candidateCommit, input.productPin)
  const status = currentContainsFix ? 'ALREADY_INTEGRATED' : candidateContainsFix && candidateDescendsFromPin ? 'READY_TO_INTEGRATE' : 'NEEDS_REVIEW'
  return { schemaVersion: 1, status, productPin: input.productPin, fixCommit: input.fixCommit, candidateCommit: input.candidateCommit, currentContainsFix, candidateContainsFix, candidateDescendsFromPin, qualification: 'COMMIT_ANCESTRY_ONLY', limitations: ['The supplied fix commit must be reviewed as the relevant repair.', 'Ancestry does not detect later reverts or prove runtime correctness.', 'This status does not qualify a patch for publication or claim hardware validation.'] }
}
module.exports = { scan, assess }
