import log_thingy from './import_me.ts'
import Test from './Test.svelte'

log_thingy('sup did you defer')

new Test({
	target: document.getElementById('target'),
})

console.log('writing and stuff')

const livereload_port = 35730

const script = document.createElement(`script`)
script.src = `http://${
	(location.host || `localhost`).split(`:`)[0]
}:${livereload_port}/livereload.js?snipver=1`
document.body.appendChild(script)
