import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'

const source = path.resolve(process.argv[2] || 'sources/xjadeo-44')
const report = {
  issue: 'https://github.com/x42/xjadeo/issues/44',
  revision: 'cc977680758a58ed35a4ee9e9408fa31bd9a4de7',
  evidence: 'WM_CLASS contracts for native X11, GLX and SDL 1.2 backends',
  hardwareVerified: false,
  results: [],
}
const record = (name, fn) => {
  const started = performance.now()
  try { fn(); report.results.push({ name, status: 'PASS', durationMs: Math.round(performance.now() - started) }) }
  catch (error) { report.results.push({ name, status: 'FAIL', durationMs: Math.round(performance.now() - started), message: error.message }) }
}

for (const [backend, file] of [['X11', 'display_x11.c'], ['GLX', 'display_glx.c']]) {
  record(`${backend} sets the expected instance and application class`, () => {
    const text = readFileSync(path.join(source, 'src/xjadeo', file), 'utf8')
    if (!text.includes('XClassHint class_hint = { "xjadeo", "Xjadeo" };')) throw new Error(`${backend} class hint is missing`)
    if (!text.includes('XSetClassHint(')) throw new Error(`${backend} never applies its class hint`)
  })
}

record('SDL supplies its X11 class before initializing video', () => {
  const text = readFileSync(path.join(source, 'src/xjadeo/display_sdl.c'), 'utf8')
  const hint = text.indexOf('SDL_putenv("SDL_VIDEO_X11_WMCLASS=xjadeo")')
  const init = text.indexOf('SDL_Init(SDL_INIT_VIDEO)')
  if (hint < 0 || init < 0 || hint > init) throw new Error('SDL WM class must be set before SDL_Init')
})

mkdirSync('reports', { recursive: true })
writeFileSync('reports/xjadeo-44.json', JSON.stringify(report, null, 2) + '\n')
for (const result of report.results) console.log(`${result.status}: ${result.name}${result.message ? ': ' + result.message : ''}`)
if (report.results.some(result => result.status === 'FAIL')) process.exitCode = 1
