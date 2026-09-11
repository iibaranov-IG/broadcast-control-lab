// Network-enabled acquisition only. No case-provided commands or package scripts.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { load } = require('./case.cjs')
const c = load(process.argv[2])
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
