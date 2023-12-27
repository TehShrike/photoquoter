import assert from './assert.ts'

type JsonablePrimitives = string | number | boolean | null
type JsonableValue = JsonablePrimitives | JsonablePrimitives[]

export const querystring_to_object = (querystring: string) => {
	const url_params = new URLSearchParams(querystring)
	const output: { [key: string]: string | string[] } = {}

	url_params.forEach((value, key) => {
		if (key in output) {
			const initial_value = output[key]
			if (!Array.isArray(initial_value)) {
				assert(typeof initial_value === 'string', `output[${key}] is a string`)
				output[key] = [initial_value]
			}

			const array_value = output[key]
			assert(Array.isArray(array_value), `output[${key}] is an array`)
			array_value.push(value)
		} else {
			output[key] = value
		}
	})

	return output
}

export const deserialize_url = (querystring: string) => {
	const url_params = new URLSearchParams(querystring)
	const output: { [key: string]: JsonableValue } = {}

	url_params.forEach((json_value, key) => {
		try {
			output[key] = JSON.parse(json_value) as JsonableValue
		} catch (err) {
			console.warn(`Wasn't able to parse`, json_value)
		}
	})

	return output
}

export const serialize_to_url = (data_to_serialize: { [key: string]: JsonableValue }) => {
	const query_string = Object.entries(data_to_serialize).filter(
		([, value]) => value !== undefined,
	).map(
		([key, value]) => `${key}=${encodeURIComponent(JSON.stringify(value))}`,
	).join(`&`)

	history.replaceState(data_to_serialize, ``, query_string ? `?` + query_string : `.`)
}
