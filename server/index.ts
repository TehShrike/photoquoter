import { serveDir } from 'std/http/file_server.ts'
import { assert } from 'std/assert/assert.ts'

import create_router from './router.ts'
import crease_mysql from './mysql.ts'
import { utc_to_iso_date, utc_to_iso_datetime } from './date.ts'

const mysql_client = await crease_mysql()

const api_router = create_router({
	'test': {
		GET: (_req) => {
			return new Response('it works, cool')
		},
	},
	'mysqlnow': {
		GET: async (_req) => {
			const { rows } = await mysql_client.execute('SELECT NOW() AS datetime')

			assert(rows)

			return new Response(utc_to_iso_datetime(rows[0].datetime))
		},
	},
	'mysqlcurdate': {
		GET: async () => {
			const { rows } = await mysql_client.execute('SELECT CURDATE() AS date')

			assert(rows)

			console.log(rows[0])

			return new Response(utc_to_iso_date(rows[0].date))
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
