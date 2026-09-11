const fs = require('node:fs')
const path = require('node:path')

const issuePattern = /^https:\/\/github\.com\/([A-Za-z0-9][\w.-]*\/[A-Za-z0-9][\w.-]*)\/issues\/([1-9]\d*)\/?$/
const namePattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function issues(contents, limit = 100) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Campaign limit must be 1..100')
  const values = String(contents).split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => {
    const match = issuePattern.exec(line)
    if (!match) throw new Error(`Invalid GitHub issue URL: ${line}`)
    return `https://github.com/${match[1]}/issues/${match[2]}`
  })
  if (!values.length) throw new Error('Campaign needs at least one issue URL')
  if (values.length > limit) throw new Error(`Campaign has ${values.length} issues; limit is ${limit}`)
  if (new Set(values.map(value => value.toLowerCase())).size !== values.length) throw new Error('Campaign issue URLs must be distinct')
  return values
}

function options(args) {
  const result = { concurrency: 4, limit: 100, retryFailed: false }
  for (let index = 0; index < args.length; index++) {
    const key = args[index]
    if (key === '--retry-failed') { result.retryFailed = true; continue }
    const value = args[++index]
    if (!value || value.startsWith('--') || !['--file', '--concurrency', '--limit'].includes(key)) throw new Error('Use --file issues.txt, --concurrency 1..8, --limit 1..100, or --retry-failed')
    if (key === '--file') result.file = value
    else result[key.slice(2)] = Number(value)
  }
  if (!Number.isInteger(result.concurrency) || result.concurrency < 1 || result.concurrency > 8) throw new Error('Campaign concurrency must be 1..8')
  if (!Number.isInteger(result.limit) || result.limit < 1 || result.limit > 100) throw new Error('Campaign limit must be 1..100')
  return result
}

function directory(root, name) {
  if (!namePattern.test(name || '')) throw new Error('Campaign name must use lowercase letters, digits and hyphens')
  return path.join(root, 'reports', 'campaigns', name)
}

function write(directory, state) {
  fs.mkdirSync(directory, { recursive: true })
  state.updatedAt = new Date().toISOString()
  const temporary = path.join(directory, `state-${process.pid}.tmp`)
  fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n')
  fs.renameSync(temporary, path.join(directory, 'state.json'))
  const counts = state.items.reduce((result, item) => { result[item.status] = (result[item.status] || 0) + 1; return result }, {})
  const rows = state.items.map((item, index) => `| ${index + 1} | ${item.status} | [${item.issue}](${item.issue}) | ${item.report ? `[report](${path.relative(directory, item.report)})` : ''} |`)
  fs.writeFileSync(path.join(directory, 'CAMPAIGN.md'), ['# BCL repair campaign', '', `Campaign: **${state.name}**`, `Updated: ${state.updatedAt}`, '', ...Object.entries(counts).sort().map(([key, value]) => `- ${key}: ${value}`), '', '| # | State | Issue | Triage |', '| ---: | --- | --- | --- |', ...rows, ''].join('\n'))
}

async function run(root, name, opts, triage = null) {
  const target = directory(root, name)
  const stateFile = path.join(target, 'state.json')
  let state
  if (fs.existsSync(stateFile)) {
    state = JSON.parse(fs.readFileSync(stateFile))
    if (state.schemaVersion !== 1 || state.name !== name || !Array.isArray(state.items)) throw new Error('Invalid campaign checkpoint')
    if (opts.file) {
      const supplied = issues(fs.readFileSync(path.resolve(opts.file), 'utf8'), opts.limit)
      if (JSON.stringify(supplied) !== JSON.stringify(state.items.map(item => item.issue))) throw new Error('Campaign input differs from its checkpoint')
    }
  } else {
    if (!opts.file) throw new Error('A new campaign requires --file issues.txt')
    const supplied = issues(fs.readFileSync(path.resolve(opts.file), 'utf8'), opts.limit)
    state = { schemaVersion: 1, name, createdAt: new Date().toISOString(), items: supplied.map(issue => ({ issue, status: 'PENDING', attempts: 0 })) }
  }
  if (!triage) {
    const read = require('./github-read.cjs').reader()
    const cache = new Map()
    const sharedRead = endpoint => {
      if (!cache.has(endpoint)) cache.set(endpoint, read(endpoint).catch(error => { cache.delete(endpoint); throw error }))
      return cache.get(endpoint)
    }
    triage = (root, issue, args) => require('./triage.cjs').run(root, issue, args, sharedRead)
  }
  for (const item of state.items) {
    if (item.status === 'NEEDS_INFO' && item.data && fs.existsSync(item.data)) {
      try { if (JSON.parse(fs.readFileSync(item.data)).errors?.length) item.status = 'READ_FAILED' } catch {}
    }
    if (item.status === 'RUNNING' || (opts.retryFailed && ['FAILED', 'READ_FAILED'].includes(item.status))) item.status = 'PENDING'
  }
  write(target, state)
  let cursor = 0
  async function worker() {
    while (true) {
      const item = state.items.find((candidate, index) => index >= cursor && candidate.status === 'PENDING')
      if (!item) return
      cursor = state.items.indexOf(item) + 1
      item.status = 'RUNNING'; item.attempts++; item.startedAt = new Date().toISOString(); delete item.error
      write(target, state)
      try {
        const result = await triage(root, item.issue, [])
        const report = JSON.parse(fs.readFileSync(result.data))
        item.status = report.errors?.length ? 'READ_FAILED' : result.decision
        item.report = result.report
        item.data = result.data
      } catch (error) {
        item.status = 'FAILED'; item.error = error.message
      }
      item.completedAt = new Date().toISOString()
      write(target, state)
    }
  }
  await Promise.all(Array.from({ length: Math.min(opts.concurrency, state.items.length) }, worker))
  const complete = state.items.every(item => !['PENDING', 'RUNNING'].includes(item.status))
  state.status = complete ? (state.items.some(item => ['FAILED', 'READ_FAILED'].includes(item.status)) ? 'COMPLETE_WITH_FAILURES' : 'COMPLETE') : 'INCOMPLETE'
  write(target, state)
  return { campaign: name, status: state.status, checkpoint: stateFile, report: path.join(target, 'CAMPAIGN.md'), counts: state.items.reduce((result, item) => { result[item.status] = (result[item.status] || 0) + 1; return result }, {}) }
}

module.exports = { issues, options, run }
