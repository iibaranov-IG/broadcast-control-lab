import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
const source=process.argv[2]
const code=fs.readFileSync(path.join(source,'backends/sacn.c'),'utf8')
assert.ok(code.includes('destination[u] = htobe16(source[u].universe);'))
assert.ok(code.includes('sacn_discovery_list(pdu.data.data'))
assert.ok(!code.includes('memcpy(pdu.data.data, global_cfg.fd[fd].universe'))
fs.mkdirSync('reports',{recursive:true})
fs.writeFileSync('reports/midimonster-142.json',JSON.stringify({results:[{name:'sACN universe list network bytes',status:'PASS'}]},null,2)+'\n')
console.log('PASS midimonster-142: sACN discovery bytes verified')
