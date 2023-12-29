import { serveDir } from 'std/http/file_server.ts'
import { assert } from 'std/assert/assert.ts'

import type { PoolConnection } from 'npm:mysql2/promise'

import create_mysql from './mysql.ts'
import make_mysql_helpers_object from './util/mysql_helpers_object.ts'
import initialize_connection_logging_state from './util/make_mysql_object_log_queries.ts'
import api from './api.ts'
import type { Context } from './api.ts'
import fancy_serializer from '../shared/fancy_serializer.ts'

const make_mysql_object_log_queries = initialize_connection_logging_state()

console.log('Connecting to mysql...')
const mysql_pool = await create_mysql()
console.log('Connected, starting server')

const fancy_json_content_type = 'application/fancy_json'

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
		console.log('API request:', api_path)
		const api_function = get_api_function(api_path.split('.'), api)

		const content_type = request.headers.get('content-type')
		assert(content_type && content_type.toLowerCase() === fancy_json_content_type)

		console.time('Deserializing')
		const body = fancy_serializer.deserialize(await request.text())
		console.timeEnd('Deserializing')

		let mysql_connection: PoolConnection | null = null
		try {
			mysql_connection = make_mysql_object_log_queries(await mysql_pool.getConnection())
			const mysql = make_mysql_helpers_object(mysql_connection)
			console.time('Running API function')
			const response_body = await api_function({ mysql, request }, body)
			console.timeEnd('Running API function')

			if (response_body instanceof Response) {
				return response_body
			}

			return new Response(fancy_serializer.serialize(response_body), {
				headers: {
					'content-type': fancy_json_content_type,
				},
			})
		} catch (err) {
			console.error('error thrown by', pathname)
			console.error(err)
			return new Response(err.message, {
				status: err.status_code || 500,
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
