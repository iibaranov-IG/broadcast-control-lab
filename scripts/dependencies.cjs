// Network-enabled acquisition only. No case-provided commands or package scripts.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { load } = require('./case.cjs')
const c = load(process.argv[2])
if (c.id === 'c64cast-368' && c.sources.length === 1 && c.sources[0].repository === 'kfox/c64cast' && c.sources[0].commit === 'b9abd3dd0447086c94c960665eb4a57b1172eef9') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'uv.lock': '264c5ebc1d59562b854af2ab63d2bd030b360088ad559b85e0cb1f6cf52f5a05', 'pyproject.toml': '19ef7e9ab0791bc64331e6d5a482fd97002b4182370ccec622b3b18f1e0f390b' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('c64cast dependency manifest changed; review required')
  execFileSync('uv', ['sync', '--frozen', '--no-install-project', '--no-default-groups', '--group', 'dev', '--extra', 'web', '--no-build', '--python', '/usr/local/bin/python3'], { cwd: source, stdio: 'inherit', env: { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' } })
  process.exit(0)
}
if (c.id !== 'aten-2029' || c.sources[0].repository !== 'bitfocus/companion-module-aten-matrix') throw new Error('No audited dependency acquisition recipe for this case')
const source = path.resolve(c.sources[0].directory)
const deps = '/work/.cache/dependencies'
fs.mkdirSync(deps, { recursive: true })
const original = JSON.parse(fs.readFileSync(path.join(source, 'package.json')))
const expected = { '@companion-module/base': '~1.7.0', '@companion-module/tools': '^2.8.0' }
if (JSON.stringify({ ...original.dependencies, ...original.devDependencies }) !== JSON.stringify(expected)) throw new Error('Dependency set changed; review required')
fs.writeFileSync(path.join(deps, 'package.json'), JSON.stringify({ name: 'bcl-deps', version: '1.0.0', private: true, dependencies: expected }))
fs.copyFileSync(path.join(source, 'yarn.lock'), path.join(deps, 'yarn.lock'))
execFileSync('corepack', ['yarn@1.22.22', 'install', '--frozen-lockfile', '--ignore-scripts', '--non-interactive'], { cwd: deps, stdio: 'inherit' })
fs.cpSync(path.join(deps, 'node_modules'), path.join(source, 'node_modules'), { recursive: true })
