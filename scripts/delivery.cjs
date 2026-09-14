const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

function options(argv) {
  const out = { artifact: null, url: null, command: null }
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i]
    if (!['--artifact', '--url', '--command'].includes(key) || !argv[i + 1]) throw new Error('Use --artifact <file>, --url <https-url>, or --command <text>')
    const name = key.slice(2)
    if (out[name]) throw new Error(`Duplicate ${key}`)
    out[name] = argv[++i]
  }
  if ([out.artifact, out.url, out.command].filter(Boolean).length !== 1) throw new Error('Choose exactly one delivery method')
  if (out.url && !/^https:\/\//.test(out.url)) throw new Error('Delivery URL must use HTTPS')
  return out
}

function regular(filename) {
  const stat = fs.lstatSync(filename)
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Delivery artifact must be a regular file')
  return stat
}

async function probe(url, request = fetch) {
  const response = await request(url, { method: 'HEAD', redirect: 'follow' })
  if (!response.ok) throw new Error(`Delivery URL returned HTTP ${response.status}`)
  return { finalUrl: response.url || url, status: response.status, contentType: response.headers?.get?.('content-type') || null, contentLength: Number(response.headers?.get?.('content-length')) || null }
}

async function create(root, c, opts, request = fetch) {
  const directory = path.join(root, 'reports', c.id, 'delivery')
  fs.mkdirSync(directory, { recursive: true })
  const generatedAt = new Date().toISOString()
  let method
  if (opts.artifact) {
    const source = path.resolve(opts.artifact), stat = regular(source)
    const name = path.basename(source), destination = path.join(directory, name)
    fs.copyFileSync(source, destination)
    const bytes = fs.readFileSync(destination)
    method = { kind: 'artifact', file: name, size: stat.size, sha256: crypto.createHash('sha256').update(bytes).digest('hex') }
  } else if (opts.url) {
    method = { kind: 'url', url: opts.url, probe: await probe(opts.url, request) }
  } else {
    method = { kind: 'command', command: opts.command }
  }
  const manifest = { schemaVersion: 1, case: c.id, issue: c.issue, generatedAt, method }
  fs.writeFileSync(path.join(directory, 'delivery.json'), JSON.stringify(manifest, null, 2) + '\n')
  const steps = method.kind === 'artifact'
    ? [`Download **${method.file}** from this delivery folder.`, `Verify SHA-256: \`${method.sha256}\`.`, 'Install or run it using the project’s normal procedure.']
    : method.kind === 'url'
      ? [`Open the verified test build: ${method.probe.finalUrl}`, `The availability check returned HTTP ${method.probe.status}.`]
      : [`Run: \`${method.command.replace(/\`/g, '\\`')}\``]
  const check = c.ownerCheck || {}
  const markdown = [`# Test delivery: ${c.title}`, '', `Issue: ${c.issue}`, `Generated: ${generatedAt}`, '', '## Install or open', '', ...steps.map(s => `1. ${s}`), '', '## Verify', '', check.procedure || 'Repeat the original issue steps.', '', 'Expected:', '', check.expected || c.acceptance || 'The reported failure no longer occurs.', '', 'Please report the application version, device/OS, observed result, and whether the original failure still occurs.', ''].join('\n')
  fs.writeFileSync(path.join(directory, 'DELIVERY.md'), markdown)
  return { directory, manifest: path.join(directory, 'delivery.json'), instructions: path.join(directory, 'DELIVERY.md'), method }
}

module.exports = { options, probe, create }
