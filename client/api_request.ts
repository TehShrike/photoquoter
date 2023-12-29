import type { ConsumableApi } from '../server/api'
import api_shape from './api_shape.ts'
import fancy_serializer from '../shared/fancy_serializer.ts'

const fancy_json_content_type = 'application/fancy_json'

const futch = async (url, options: { body: any; headers?: { [prop: string]: string } }) => {
	const response = await fetch(url, {
		method: 'POST',
		body: fancy_serializer.serialize(options.body),
		headers: {
			'content-type': fancy_json_content_type,
			...options.headers,
		},
	})

	if (!response.ok) {
		return Promise.reject(response)
	}

	if (
		response.headers.has('content-type') &&
		response.headers.get('content-type') === fancy_json_content_type
	) {
		return fancy_serializer.deserialize(await response.text())
	}
}

type Shape = {
	[prop: string]: 'function' | Shape
}

const make_fetch_function_for_endpoint = (name: string) => (arg: any = null) =>
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

export default api as ConsumableApi
