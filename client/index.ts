import LineItem from './LineItem.svelte'

type State = {
	line_items: {
		id: string
		image_data_url: string | null
	}[]
}

const get_state_from_local_storage = (): State => {
	const line_items_string = localStorage.getItem('line_items')

	if (line_items_string) {
		return JSON.parse(line_items_string)
	}

	return {
		line_items: [{
			id: crypto.randomUUID(),
			image_data_url: null,
		}],
	}
}

new LineItem({
	target: document.getElementById('target'),
})

console.log('writing and stuff')

if (env.environment === 'development') {
	const livereload_port = 35730

	const script = document.createElement(`script`)
	script.src = `http://${
		(location.host || `localhost`).split(`:`)[0]
	}:${livereload_port}/livereload.js?snipver=1`
	document.body.appendChild(script)
}
