import type { ConsumableApi } from '../server/api'
import api_shape from './api_shape.ts'

const json_content_type = 'application/json'

const futch = async (url, options: { body: any; headers?: { [prop: string]: string } }) => {
	const response = await fetch(url, {
		method: 'POST',
		body: JSON.stringify(options.body),
		headers: {
			'content-type': json_content_type,
			...options.headers,
		},
	})

	if (!response.ok) {
		return Promise.reject(response)
	}

	if (
		response.headers.has('content-type') &&
		response.headers.get('content-type') === json_content_type
	) {
		return response.json()
	}
}

type Shape = {
	[prop: string]: 'function' | Shape
}

const make_fetch_function_for_endpoint = (name: string) => (arg: any) =>
	futch(`/api/${name}`, {
		body: arg,
	})

const turn_object_into_endpoint_functions = (object: Shape, prefix: string = '') =>
	Object.fromEntries(
		Object.entries(object).map((
			[prop, value],
		) => [
			prop,
			value === 'function'
				? make_fetch_function_for_endpoint(prefix + prop)
				: turn_object_into_endpoint_functions(value, prop + '.'),
		]),
	)

const api = turn_object_into_endpoint_functions(api_shape)
console.log(api)
debugger
export default api as ConsumableApi
