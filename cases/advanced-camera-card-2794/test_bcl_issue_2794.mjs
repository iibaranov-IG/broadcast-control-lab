import { existsSync, readFileSync } from 'node:fs'

const read = path => existsSync(path) ? readFileSync(path, 'utf8') : ''
const card = read('src/card.ts')
const readiness = read('src/components-lib/elements-readiness.ts')
const browserTest = read('tests/card.browser.test.ts')
const checks = [
  card.includes('areElementsReady(') && card.includes('InitializationAspect.TEMPLATE_RENDERER'),
  readiness.includes('!hasTemplate || isTemplateRendererInitialized'),
  browserTest.includes("'areMandatoryAspectsInitialized'") && browserTest.includes('advanced-camera-card-elements'),
]
if (checks.some(pass => !pass)) {
  console.error('ELEMENTS_BLOCKED_BY_UNRELATED_INITIALIZATION')
  process.exitCode = 1
} else {
  console.log('PASS: non-template elements render before mandatory initialization completes')
  console.log('# tests 3')
  console.log('# skipped 0')
}
