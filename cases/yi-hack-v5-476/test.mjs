import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

const root = process.argv[2]
const handlers = new Map()
const requests = []
const document = { getElementById: () => ({ innerHTML: '', src: '' }) }
function jquery(selector) {
  return {
    attr() {}, hide() {}, show() {},
    on(event, target, handler) { handlers.set(`${event}:${target}`, handler) },
    prop(name) { return selector.includes('PRESET_NAME') && name === 'value' ? 'Studio' : undefined },
    val() { return selector.includes('#select-del') ? '3' : undefined },
    text() { return '1 - Home' },
  }
}
jquery.ajax = options => {
  requests.push({ type: options.type, url: options.url })
  if (options.url === 'cgi-bin/status.json') options.success({ model_suffix: 'yi_dome' })
  if (options.url.includes('get_configs.sh')) options.success({ 1: 'Home,0,0' })
  if (options.type === 'POST') options.success({})
}
jquery.get = () => {}
const context = {
  APP: {}, console, document, jQuery: jquery, $: jquery,
  setTimeout() {}, Date, window: { location: { reload() {} } },
}
const modulePath = path.join(root, 'src/www/httpd/htdocs/js/modules/ptz.js')
vm.runInNewContext(fs.readFileSync(modulePath, 'utf8'), context)
context.APP.ptz.init()
for (const selector of ['#button-add', '#button-del', '#button-del-all']) {
  if (handlers.has(`click:${selector}`)) handlers.get(`click:${selector}`)({})
}
const expected = [
  { type: 'POST', url: 'cgi-bin/preset.sh?action=add_preset&name=Studio' },
  { type: 'POST', url: 'cgi-bin/preset.sh?action=del_preset&num=3' },
  { type: 'POST', url: 'cgi-bin/preset.sh?action=del_preset&num=all' },
]
const actual = requests.filter(request => request.type === 'POST')
const checks = [
  ['add button is registered', handlers.has('click:#button-add')],
  ['delete button is registered', handlers.has('click:#button-del')],
  ['delete-all button is registered', handlers.has('click:#button-del-all')],
  ['all preset operations reach the existing CGI contract', JSON.stringify(actual) === JSON.stringify(expected)],
]
const results = checks.map(([name, ok]) => ({ name, status: ok ? 'PASS' : 'FAIL' }))
fs.mkdirSync('reports', { recursive: true })
fs.writeFileSync('reports/yi-hack-v5-476.json', JSON.stringify({ results, requests: actual }, null, 2) + '\n')
for (const result of results) console.log(`${result.status}: ${result.name}`)
if (results.some(result => result.status !== 'PASS')) process.exit(1)
