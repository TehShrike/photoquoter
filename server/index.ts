import { serveDir } from 'std/http/file_server.ts'
import { assert } from 'std/assert/assert.ts'

import crease_mysql from './mysql.ts'
import api from './api.ts'
import type { Context } from './api.ts'

const mysql_client = await crease_mysql()

type ParamValidator<T> = (query_params: { [key: string]: string | string[] }) => T
type PvContents<T> = T extends ParamValidator<infer U> ? U : T

// deno-lint-ignore no-explicit-any
type ApiFunctionImplementation = (arg: any, context: Context) => Promise<any>
type ApiObject = {
	[prop: string]: ApiFunctionImplementation | ApiObject
}
const get_api_function = (
	props: string[],
	api: ApiObject | ApiFunctionImplementation,
): ApiFunctionImplementation => {
	console.log('get_api_function got passed props', props)
	if (props.length === 0) {
		assert(typeof api === 'function')
		console.log('Returning api function', api)
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

	console.log('pathname:', pathname)

	if (pathname.startsWith('/api/')) {
		const api_path = pathname.slice('/api/'.length)
		const api_function = get_api_function(api_path.split('.'), api)

		const content_type = request.headers.get('content-type')
		assert(content_type && content_type.toLowerCase() === 'application/json')

		const body = await request.json()

		console.log('Calling api_function, body is', body)
		try {
			const response_body = await api_function(body, { mysql: mysql_client, request })
			return new Response(JSON.stringify(response_body), {
				headers: {
					'content-type': 'application/json',
				},
			})
		} catch (err) {
			console.error('error happened mmm', err.message)
			return new Response(err.message, {
				status: 500,
			})
		}
	}

	return serveDir(request, {
		fsRoot: 'public',
	})
})
