import { serveDir } from 'std/http/file_server.ts'
import { assert } from 'std/assert/assert.ts'

import create_router from './router.ts'
import type { Handler } from './router.ts'
import crease_mysql from './mysql.ts'
import { utc_to_iso_date, utc_to_iso_datetime } from './date.ts'
import { endpoint } from './endpoint_type.ts'
import type { Endpoint } from './endpoint_type.ts'
import pv from './param_validator.ts'
import jv from '../shared/json_validator.ts'

const mysql_client = await crease_mysql()

type ParamValidator<T> = (query_params: { [key: string]: string | string[] }) => T
type PvContents<T> = T extends ParamValidator<infer U> ? U : T

// const v = pv({
// 	maybe: pv.optional(pv.one_of('not', 'so')),
// })

type Huh = Endpoint<typeof jv.null, typeof v, typeof v>
type Meh = Huh['fn']

type Wat = PvContents<typeof v>

type RouterMiddlewareArgument = {
	// deno-lint-ignore no-explicit-any
	fn: Handler<any>
	route_params: { [param: string]: string }
	// deno-lint-ignore no-explicit-any
} & Endpoint<any, any, any>

const v = pv({
	yes: pv.optional(pv.one_of('sir', 'maam')),
})
const api_router = create_router({
	'mysqlnow': {
		GET: endpoint({
			body_validator: jv.object({
				anything: jv.string,
			}),
			query_param_validator: v,
			fn: async (_req, { query_params, mysql }) => {
				console.log('got query_params.yes', query_params.yes)

				const { rows } = await mysql.execute('SELECT NOW() AS datetime')

				assert(rows)

				return new Response(utc_to_iso_datetime(rows[0].datetime))
			},
		}),
	},
	'mysqlcurdate': {
		GET: async (_req, { mysql }) => {
			const { rows } = await mysql.execute('SELECT CURDATE() AS date')

			assert(rows)

			console.log(rows[0])

			return new Response(utc_to_iso_date(rows[0].date))
		},
	},
}, {
	prefix: '/api/',
	async route_executor(req, route: RouterMiddlewareArgument) {
		const content_type = req.headers.get('content-type')

		let body = null

		if (content_type && content_type.toLowerCase() === 'application/json') {
			body = await req.json()

			if (route.body_validator && !route.body_validator.is_valid(body)) {
				return new Response(
					`Invalid body\n${route.body_validator.get_messages(body, 'body')}`,
					{
						status: 400,
					},
				)
			}
		}

		const url = new URL(req.url)
		const query_params = Object.fromEntries(url.searchParams.entries())

		if (route.query_param_validator) {
			try {
				route.query_param_validator(query_params)
			} catch (err) {
				return new Response(err.message, { status: 400 })
			}
		}

		if (route.route_param_validator) {
			try {
				route.route_param_validator(route.route_params)
			} catch (err) {
				return new Response(err.message, { status: 400 })
			}
		}

		return route.fn(req, {
			route_params: route.route_params,
			query_params,
			body,
			url,
			mysql: mysql_client,
		})
	},
})

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
