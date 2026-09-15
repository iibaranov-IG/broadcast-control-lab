// Network-enabled acquisition only. No case-provided commands or package scripts.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { load } = require('./case.cjs')
const c = load(process.argv[2])
if (c.id === 'tonepush-9' && c.sources.length === 1 && c.sources[0].repository === 'crmne/tonepush' && c.sources[0].commit === '9c5fe357c563da8d3ac971ea1e9231c665884cdd') {
  const source = path.resolve(c.sources[0].directory)
  const expected = {
    'Cargo.toml': 'bab2d822e86e7d6acf274c368e25bfbd539d195c59f0542db37317d48006c13e',
    'Cargo.lock': 'db1a77a01d7d709a444ca18d35c4118fe28e167df57ea360cc8cbb3549a7b268',
    'crates/hx-proto/Cargo.toml': '622484501c757bd9c303b3b36a0d884e253032b6085d6580ba67c7cdd835eb89',
  }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('tonepush-9 dependency manifest changed; review required')
  execFileSync('cargo', ['fetch', '--locked'], { cwd: source, stdio: 'inherit', env: { ...process.env, CARGO_HOME: '/work/.cache/cargo' } })
  process.exit(0)
}
if (c.id === 'paella-984' && c.sources.length === 1 && c.sources[0].repository === 'opencast/opencast' && c.sources[0].commit === 'c2ddb4ea73b063534349a890551c9340a9e4303c') {
  const source = path.resolve(c.sources[0].directory, 'modules/engage-paella-player-8')
  const expected = { 'package.json': '14c8da2afc1869ff0934f87c2bd48e0d1859cb30e428179039d3659e2e4ff351', 'package-lock.json': '107554c8b3c22b681213d40ea1ade77dd3b43d27bb80a3cdc6d933bcd328ccec' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('paella-984 dependency manifest changed; review required')
  execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: source, stdio: 'inherit' })
  for (const dependency of ['@asicupv/paella-core@2.11.3', '@asicupv/paella-opencast-core@2.0.3', '@asicupv/paella-opencast-skin@2.0.1']) execFileSync('npm', ['cache', 'add', dependency], { cwd: source, stdio: 'inherit' })
  process.exit(0)
}
if (c.id === 'rmfakecloud-485' && c.sources.length === 1 && c.sources[0].repository === 'ddvk/rmfakecloud' && c.sources[0].commit === '1958bff18a530038d3916cba0168ad99a24220b4') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'ui/package.json': 'd3084024d201cac60925ff500378b7d4f0980f294200f900886a6676a535194b', 'ui/pnpm-lock.yaml': '28fa36d604416e840e70e95ecdf8896e636702f351f91c246ce57e74127e3718' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('rmfakecloud dependency manifest changed; review required')
  execFileSync('corepack', ['pnpm@10.17.1', 'install', '--frozen-lockfile', '--ignore-scripts'], { cwd: path.join(source, 'ui'), stdio: 'inherit' })
  process.exit(0)
}
if (c.id === 'blueye-sdk-225' && c.sources.length === 1 && c.sources[0].repository === 'BluEye-Robotics/blueye.sdk' && c.sources[0].commit === 'd1fbfaeb9630b34d5c5eb97ce298e79f24e8fb02') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'pyproject.toml': 'e6acf89bb51aa47d0273f70d85181521a25cd23045e8d1ff03e1442410d10c67', 'uv.lock': '866386ffe3ac1b28910c682ccadb80bcdf49bb835734650429ddde13297cbdb0' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('blueye-sdk dependency manifest changed; review required')
  execFileSync('uv', ['sync', '--frozen', '--no-install-project', '--group', 'dev', '--no-build', '--python', '/usr/local/bin/python3'], { cwd: source, stdio: 'inherit', env: { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' } })
  process.exit(0)
}
if (c.id === 'noisy-studio-99' && c.sources.length === 1 && c.sources[0].repository === 'noisy/noisy-studio' && c.sources[0].commit === '55024b577cbcb015b2979785160b3f74e047ee65') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'pyproject.toml': 'e3218d6eba934fb38b9f0180ed771ff44ae803d478fd741848ff6335617d6248', 'uv.lock': '4f061c16c3b6ca6d591bed02003f0cd3875e2d5a6144a8b369938ff23ac3dc14', 'dashboard/package.json': 'e5be74411f9a95e6c54cb00b641762c94ff1a3d93c86ef053a414cf84b622ce9', 'dashboard/package-lock.json': '3a31936b6fc2360a577bde06a4114425fceb5f82f9b7aba153bc741b96211c6d' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('noisy-studio dependency manifest changed; review required')
  const env = { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' }
  execFileSync('uv', ['sync', '--frozen', '--group', 'dev', '--no-build', '--python', '/usr/local/bin/python3'], { cwd: source, stdio: 'inherit', env })
  execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: path.join(source, 'dashboard'), stdio: 'inherit' })
  process.exit(0)
}
if (c.id === 'srctools-51' && c.sources.length === 1 && c.sources[0].repository === 'TeamSpen210/srctools' && c.sources[0].commit === '7dfff9fb77c0abd01bdc7f9c1b93dcc6b553099f') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'pyproject.toml': '7e34aec2d0e0598c7f38e4de8ecd8ef74fee65fe38310e450fc80c9767653893', 'test-requirements.txt': '0fb71dc700eb61278132a7fdf880ac03a13329d1866c5eb74184d033873aea00' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('srctools dependency manifest changed; review required')
  const env = { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' }
  execFileSync('uv', ['venv', '--python', '/usr/local/bin/python3', '.venv'], { cwd: source, stdio: 'inherit', env })
  execFileSync('uv', ['pip', 'install', '--python', '.venv/bin/python', '--no-build', 'attrs==26.1.0', 'dirty-equals==0.11', 'pillow==11.3.0', 'pytest==9.1.1', 'pytest-datadir==1.8.0', 'pytest-regressions==2.11.0', 'pyyaml==6.0.3', 'typing-extensions==4.16.0', 'useful-types==0.2.1'], { cwd: source, stdio: 'inherit', env })
  process.exit(0)
}
if (c.id === 'c64cast-368' && c.sources.length === 1 && c.sources[0].repository === 'kfox/c64cast' && c.sources[0].commit === 'b9abd3dd0447086c94c960665eb4a57b1172eef9') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'uv.lock': '264c5ebc1d59562b854af2ab63d2bd030b360088ad559b85e0cb1f6cf52f5a05', 'pyproject.toml': '19ef7e9ab0791bc64331e6d5a482fd97002b4182370ccec622b3b18f1e0f390b' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('c64cast dependency manifest changed; review required')
  execFileSync('uv', ['sync', '--frozen', '--no-install-project', '--no-default-groups', '--group', 'dev', '--extra', 'web', '--no-build', '--python', '/usr/local/bin/python3'], { cwd: source, stdio: 'inherit', env: { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' } })
  // Acquire only the pinned build backend wheel online; project hooks run offline.
  execFileSync('uv', ['pip', 'install', '--python', '.venv/bin/python', '--no-build', 'setuptools==83.0.0'], { cwd: source, stdio: 'inherit', env: { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' } })
  process.exit(0)
}
if (c.id === 'reolink-aio-204' && c.sources.length === 1 && c.sources[0].repository === 'starkillerOG/reolink_aio' && c.sources[0].commit === '3766907e1c49cc7ea2186ce5edc905160f6b2664') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'requirements.txt': '6e54b2a4585872f39007f34c2c78e2833d2772b76c5608534caebcc99fa5e65c' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('reolink-aio dependency manifest changed; review required')
  const env = { ...process.env, UV_CACHE_DIR: '/work/.cache/uv', UV_PYTHON_DOWNLOADS: 'never', UV_LINK_MODE: 'copy' }
  execFileSync('uv', ['venv', '--python', '/usr/local/bin/python3', '.venv'], { cwd: source, stdio: 'inherit', env })
  execFileSync('uv', ['pip', 'install', '--python', '.venv/bin/python', '--no-build', 'aiohttp==3.14.3', 'aiortsp==1.4.0', 'orjson==3.12.0', 'pycryptodomex==3.23.0', 'typing-extensions==4.16.0'], { cwd: source, stdio: 'inherit', env })
  process.exit(0)
}
if (c.id === 'camera-gallery-card-237' && c.sources.length === 1 && c.sources[0].repository === 'TheScubaDiver/camera-gallery-card' && c.sources[0].commit === '8972c56d3f37aae14fba8b9f3c73e85206af8a0b') {
  const source = path.resolve(c.sources[0].directory)
  const expected = { 'package.json': '0f0c3b324a5b485f6c846bfdbf4ed68698f105a5d5dcc65c19c3fb2bf214a184', 'package-lock.json': '642a057d436205ffc38b84598dd02eee1e7d97a682a267c16f26775cc473ff2a' }
  for (const [name, sha] of Object.entries(expected)) if (require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex') !== sha) throw new Error('camera-gallery-card dependency manifest changed; review required')
  execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: source, stdio: 'inherit' })
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
