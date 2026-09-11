const fs = require('node:fs')
const path = require('node:path')
const START = '<!-- BCL:TRACKING:START -->', END = '<!-- BCL:TRACKING:END -->'
const empty = () => ({ schemaVersion: 1, repairs: [] })
const json = value => JSON.stringify(value, null, 2) + '\n'
function link(url, kind) {
  const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/(issues|pull)\/(\d+)$/.exec(url || '')
  if (!match || (kind && match[2] !== kind)) throw new Error('Expected a canonical GitHub issue/PR URL')
  return { repo: match[1], number: match[3] }
}
function read(root) {
  const p = path.join(root, 'tracking/repairs.json')
  if (!fs.existsSync(p)) return empty()
  const db = JSON.parse(fs.readFileSync(p))
  if (db.schemaVersion !== 1 || !Array.isArray(db.repairs)) throw new Error('Unknown tracking database format')
  return db
}
function register(db, c, result, digest = null, run = null) {
  link(result.url, 'pull'); link(c.issue, 'issues')
  const prior = db.repairs.find(r => r.pr === result.url)
  if (prior) {
    if (prior.id !== c.id || (prior.candidateSha256 && digest && prior.candidateSha256 !== digest)) throw new Error('Tracking identity conflict')
    if (digest) prior.candidateSha256 = digest
    if (run) prior.run = run
    return prior
  }
  const entry = { id: c.id, title: c.title, issue: c.issue, pr: result.url, candidateSha256: digest, run, state: result.state || 'unknown', hardware: { status: 'NOT_REVIEWED' }, events: [], unread: 0 }
  db.repairs.push(entry)
  return entry
}
const cell = s => String(s ?? '').replace(/[|\r\n<>\[\]]/g, ' ')
function render(board, db) {
  const rows = db.repairs.map(r => `| ${cell(r.id)} | [Issue](${r.issue}) | [PR](${r.pr}) | ${cell(r.state)} | ${cell(r.ci || 'unknown')} | ${r.unread || 0} | ${cell(r.hardware.status)} | ${r.syncError ? 'Sync failed; prior data retained' : cell(r.lastSync || 'Not synced')} |`)
  const block = [START, '## Automatically tracked repairs', '', '| Case | Source | Repair | PR | CI | Unread events | Hardware | Last read (UTC) |', '| --- | --- | --- | --- | --- | --- | --- | --- |', ...rows, '', 'Hardware status records an explicitly imported report; comments never grant hardware verification.', END].join('\n')
  if (board.includes(START)) {
    const a = board.indexOf(START), b = board.indexOf(END, a)
    if (b < 0) throw new Error('Incomplete managed board section')
    return board.slice(0, a) + block + board.slice(b + END.length)
  }
  return board.trimEnd() + '\n\n' + block + '\n'
}
function save(root, db) {
  fs.mkdirSync(path.join(root, 'tracking'), { recursive: true })
  const p = path.join(root, 'tracking/repairs.json')
  fs.writeFileSync(p + '.tmp', json(db)); fs.renameSync(p + '.tmp', p)
  const board = path.join(root, 'REPAIRS.md')
  fs.writeFileSync(board, render(fs.existsSync(board) ? fs.readFileSync(board, 'utf8') : '# Repair board\n', db))
}
function pages(api, endpoint, field) {
  const all = []
  for (let page = 1; page <= 100; page++) {
    const response = api('GET', `${endpoint}${endpoint.includes('?') ? '&' : '?'}per_page=100&page=${page}`)
    const items = field ? response[field] : response
    if (!Array.isArray(items)) throw new Error('Unexpected GitHub list response')
    all.push(...items)
    if (items.length < 100) return all
  }
  throw new Error('Tracking pagination limit reached; previous snapshot retained')
}
function syncEntry(entry, api, now) {
  const pr = link(entry.pr, 'pull'), issue = link(entry.issue, 'issues')
  const p = `repos/${pr.repo}`, i = `repos/${issue.repo}`
  const info = api('GET', `${p}/pulls/${pr.number}`)
  const owner = api('GET', `${i}/issues/${issue.number}`).user?.login
  const events = []
  for (const [kind, endpoint] of [
    ['issue-comment', `${i}/issues/${issue.number}/comments`],
    ['pr-comment', `${p}/issues/${pr.number}/comments`],
    ['review-comment', `${p}/pulls/${pr.number}/comments`],
    ['review', `${p}/pulls/${pr.number}/reviews`],
  ]) {
    for (const item of pages(api, endpoint)) events.push({ key: `${kind}:${item.id}`, kind, author: item.user?.login || 'unknown', reporter: Boolean(owner && item.user?.login === owner), url: item.html_url, updatedAt: item.updated_at || item.submitted_at || item.created_at, state: item.state || null, body: item.body || '' })
  }
  const checks = pages(api, `${p}/commits/${info.head.sha}/check-runs`, 'check_runs')
  const status = api('GET', `${p}/commits/${info.head.sha}/status`)
  const bad = checks.some(c => c.status === 'completed' && !['success', 'neutral', 'skipped'].includes(c.conclusion)) || ['failure', 'error'].includes(status.state)
  const pending = checks.some(c => c.status !== 'completed') || (status.total_count > 0 && status.state === 'pending')
  const ci = bad ? 'failure' : pending ? 'pending' : (checks.length || status.total_count) ? 'success' : 'none'
  const old = new Map((entry.events || []).map(e => [e.key, e]))
  const fresh = events.map(e => ({ ...e, read: old.get(e.key)?.read === true && old.get(e.key)?.updatedAt === e.updatedAt && old.get(e.key)?.body === e.body && old.get(e.key)?.state === e.state }))
  return { ...entry, state: info.merged_at ? 'merged' : info.draft && info.state === 'open' ? 'draft' : info.state, headSha: info.head.sha, reporter: owner, ci, events: fresh, unread: fresh.filter(e => !e.read).length, lastSync: now, syncError: null }
}
function sync(root, api) {
  const db = read(root), errors = []
  db.repairs = db.repairs.map(entry => {
    try { return syncEntry(entry, api, new Date().toISOString()) }
    catch (error) { errors.push({ id: entry.id, error: error.message }); return { ...entry, syncError: error.message } }
  })
  save(root, db)
  return { tracked: db.repairs.length, unread: db.repairs.reduce((n, e) => n + e.unread, 0), errors }
}
function acknowledge(root, id) {
  const db = read(root), entries = db.repairs.filter(r => r.id === id)
  if (!entries.length) throw new Error('Case is not tracked')
  for (const entry of entries) { entry.events.forEach(e => { e.read = true }); entry.unread = 0 }
  save(root, db)
}
function importHardware(root, id, filename) {
  const db = read(root), result = JSON.parse(fs.readFileSync(filename))
  if (result.case !== id || !['PASS', 'FAIL', 'INCONCLUSIVE'].includes(result.result) || !/^[a-f0-9]{64}$/.test(result.candidateSha256 || '')) throw new Error('Hardware report needs a matching case, candidate hash and explicit result')
  for (const field of ['deviceModel', 'firmware', 'applicationVersion', 'steps', 'observed']) if (typeof result[field] !== 'string' || !result[field].trim()) throw new Error(`Hardware report needs ${field}`)
  const entry = db.repairs.find(r => r.id === id && r.candidateSha256 === result.candidateSha256)
  if (!entry) throw new Error('No tracked candidate matches the hardware report')
  entry.hardware = { status: `REPORTED_${result.result}`, importedAt: new Date().toISOString(), report: result }
  save(root, db)
}
function remoteRegister(root, c, result, digest, run, api) {
  return remoteUpdate(root, db => register(db, c, result, digest, run), `Track ${c.id} publication`, api)
}
function remoteUpdate(root, mutate, message, api) {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'bcl.config.json')))
  if (!/^[\w.-]+\/[\w.-]+$/.test(config.boardRepository)) throw new Error('Invalid boardRepository')
  const repo = `repos/${config.boardRepository}`
  const info = api('GET', repo), branch = info.default_branch
  for (let attempt = 0; attempt < 3; attempt++) {
    const ref = api('GET', `${repo}/git/ref/heads/${branch}`)
    const commit = api('GET', `${repo}/git/commits/${ref.object.sha}`)
    function content(p, fallback) {
      try { const f = api('GET', `${repo}/contents/${p}?ref=${ref.object.sha}`); return Buffer.from(f.content, 'base64').toString('utf8') }
      catch (error) { if (error.status === 404) return fallback; throw error }
    }
    const raw = content('tracking/repairs.json', json(empty())), db = JSON.parse(raw)
    mutate(db)
    const before = content('REPAIRS.md', '# Repair board\n'), board = render(before, db)
    if (raw === json(db) && board === before) return { repository: config.boardRepository, updated: false }
    const tree = api('POST', `${repo}/git/trees`, { base_tree: commit.tree.sha, tree: [
      { path: 'tracking/repairs.json', mode: '100644', type: 'blob', content: json(db) },
      { path: 'REPAIRS.md', mode: '100644', type: 'blob', content: board },
    ] })
    const next = api('POST', `${repo}/git/commits`, { message: `${message} [skip ci]`, parents: [ref.object.sha], tree: tree.sha })
    try { api('PATCH', `${repo}/git/refs/heads/${branch}`, { sha: next.sha, force: false }); return { repository: config.boardRepository, commit: next.sha, updated: true } }
    catch (error) {
      if (![409, 422].includes(error.status) || api('GET', `${repo}/git/ref/heads/${branch}`).object.sha === ref.object.sha) throw error
    }
  }
  throw new Error('Board changed concurrently; retry publication to register the existing PR')
}
module.exports = { read, save, register, render, syncEntry, sync, acknowledge, importHardware, remoteRegister, remoteUpdate }
