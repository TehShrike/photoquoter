import { serveDir } from 'std/http/file_server.ts'
import create_router from './router.ts'

const api_router = create_router({
	'test': {
		GET: (_req) => {
			return new Response('it works, cool')
		},
	},
}, '/api/')

Deno.serve({
	port: 8080,
}, async (req) => {
	const pathname = new URL(req.url).pathname

	console.log('pathname:', pathname)

	if (pathname.startsWith('/api')) {
		try {
			return await api_router(req)
		} catch (err) {
			console.error(err)
		}
	}

	return serveDir(req, {
		fsRoot: 'public',
	})
})
