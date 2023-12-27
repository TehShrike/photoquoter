type JsonablePrimitives = string | number | boolean | null
type JsonableValue = JsonablePrimitives | JsonablePrimitives[]

const deserialize_url = (querystring: string) => {
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

type Validator<
	DESIRED_OBJECT extends { [key: string]: any },
> = (object: unknown) => DESIRED_OBJECT

const read_querystring = <
	DESIRED_OBJECT extends { [key: string]: any },
>(validator: Validator<DESIRED_OBJECT>): DESIRED_OBJECT => {
	const value_from_search_params = deserialize_url(location.search)

	return validator(value_from_search_params)
}

export default read_querystring
