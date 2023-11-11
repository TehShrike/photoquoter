import { serveDir } from 'std/http/file_server.ts'

Deno.serve({
	port: 8080,
}, (req) => {
	const pathname = new URL(req.url).pathname
	if (pathname.startsWith('/api')) {
		return new Response('Some day there will be an API')
	}

	return serveDir(req, {
		fsRoot: 'public',
	})
})
