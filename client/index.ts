import log_thingy from './import_me.ts'
import Test from './Test.svelte'

log_thingy('sup')

new Test({
	target: document.getElementById('target'),
})
