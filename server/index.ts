import { serveDir } from 'std/http/file_server.ts'
import { assert } from 'std/assert/assert.ts'

import create_mysql from './mysql.ts'
import make_mysql_helpers_object from './util/mysql_helpers_object.ts'
import api from './api.ts'
import type { Context } from './api.ts'

const mysql_pool = await create_mysql()

type ParamValidator<T> = (query_params: { [key: string]: string | string[] }) => T
type PvContents<T> = T extends ParamValidator<infer U> ? U : T

// deno-lint-ignore no-explicit-any
type ApiFunctionImplementation = (context: Context, arg: any) => Promise<any>
type ApiObject = {
	[prop: string]: ApiFunctionImplementation | ApiObject
}
const get_api_function = (
	props: string[],
	api: ApiObject | ApiFunctionImplementation,
): ApiFunctionImplementation => {
	if (props.length === 0) {
		assert(typeof api === 'function')
		return api
	}

	assert(typeof api !== 'function')

	const [next_prop, ...rest_of_props] = props

	assert(next_prop in api)

	const next_api = api[next_prop]

	return get_api_function(rest_of_props, next_api)
}

Deno.serve({
	port: 8080,
}, async (request) => {
	const pathname = new URL(request.url).pathname

	if (pathname.startsWith('/api/')) {
		const api_path = pathname.slice('/api/'.length)
		const api_function = get_api_function(api_path.split('.'), api)

		const content_type = request.headers.get('content-type')
		assert(content_type && content_type.toLowerCase() === 'application/json')

		const body = await request.json()

		let mysql_connection = null
		try {
			mysql_connection = await mysql_pool.getConnection()
			const mysql = make_mysql_helpers_object(mysql_connection)
			const response_body = await api_function({ mysql, request }, body)
			return new Response(JSON.stringify(response_body), {
				headers: {
					'content-type': 'application/json',
				},
			})
		} catch (err) {
			console.error('error thrown by', pathname)
			console.error(err)
			return new Response(err.message, {
				status: 500,
			})
		} finally {
			if (mysql_connection) {
				mysql_connection.release()
			}
		}
	}

	return serveDir(request, {
		fsRoot: 'public',
	})
})
