export function getActions(instance) {

	let maxIO = instance.config.device;
	let maxProf = instance.config.device * 2;
	
	return {
		'LO': {
			name: 'Load Profile',
			options: [
				{
					type: 'number',
					label: 'Profile',
					id: 'num',
					default: 1,
					min: 1,
					max: maxProf
				}
			],
			callback: async(action) => {
				let opt = action.options
				let num = (opt.num > 9 ? '' : '0') + opt.num
				let cmd = `LO ${num}`

				instance.sendCmd(cmd)
			}
		},
		'SS': {
			name: 'Set Crosspoint',
			options: [
				{
					type: 'textinput',
					useVariables: true,
					label: 'Input (Source)',
					id: 'src',
					default: '1'
				},
				{
					type: 'textinput',
					useVariables: true,
					label: 'Output (Destination)',
					id: 'dst',
					default: '1'
				}
			],
			callback: async(action) => {
				let opt = action.options
				const parse = async (value) => {
                    const text = (await instance.parseVariablesInString(String(value))).trim()
                    if (!/^\d+$/.test(text)) throw new Error('Port must resolve to an integer')
                    const port = Number(text)
                    if (!Number.isSafeInteger(port) || port < 1 || port > Number(instance.config.device)) throw new Error('Port outside configured matrix range')
                    return String(port).padStart(2, '0')
                }
                const src = await parse(opt.src)
                const dst = await parse(opt.dst)
				let cmd = `SS ${src},${dst}`

				instance.sendCmd(cmd)
			}
		}
	}
}
