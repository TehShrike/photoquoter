// deno-lint-ignore-file no-explicit-any
type JsonablePrimitives = string | number | boolean | null
type JsonableValue = JsonablePrimitives | JsonableValue[] | {
	[key: string]: JsonableValue
}

type SerializerDeserializer<T, INBETWEEN extends JsonableValue> = {
	can_serialize: (value: unknown) => value is T
	serialize: (value: T) => INBETWEEN
	deserialize: (value: INBETWEEN) => T
}

type TypesMap<T, INBETWEEN extends { [key in keyof T]: any }> = {
	[type in keyof T]: SerializerDeserializer<T[type], INBETWEEN[type]>
}

// https://github.com/sindresorhus/is-plain-obj/blob/6a4cfe72714db0b90fcf6e1f78a9b118b98d44fa/index.js
const is_plain_object = (value: unknown): value is {
	[key: string]: any
} => {
	if (Object.prototype.toString.call(value) !== `[object Object]`) {
		return false
	}

	const prototype = Object.getPrototypeOf(value)
	return prototype === null || prototype === Object.prototype
}

const make_recursive_transform = <T extends TypesMap<any, any>>({
	unique_key,
	types,
}: {
	unique_key: string
	types: T
}) => {
	const types_array = Object.entries(types).map(([type, functions]) => ({ type, ...functions }))

	const recursive_transform = (value: unknown): unknown => {
		if (Array.isArray(value)) {
			return value.map((element) => recursive_transform(element))
		}

		const serialization_instructions = types_array.find(
			({ can_serialize }) => can_serialize(value),
		)

		if (serialization_instructions) {
			return {
				[unique_key]: serialization_instructions.type,
				value: serialization_instructions.serialize(value),
			}
		} else if (is_plain_object(value)) {
			return Object.fromEntries(
				Object.entries(value).map(([key, value]) => [
					key,
					recursive_transform(value),
				]),
			)
		}

		return value
	}

	return recursive_transform
}

const default_unique_key = `716B6126-54E5-41FC-80EE-7C85D57CA845` // https://xkcd.com/221/

export default <T extends TypesMap<any, any>>({ unique_key = default_unique_key, types }: {
	unique_key?: string
	types: T
}) => {
	const recursive_transform = make_recursive_transform({ unique_key, types })

	return {
		serialize: (input: unknown) => JSON.stringify(recursive_transform(input)),
		deserialize: (input: string) =>
			JSON.parse(input, (_key, value: unknown) => {
				if (is_plain_object(value) && unique_key in value) {
					const type = value[unique_key] as keyof typeof types

					console.time('Deserializing a', type)
					const output = types[type].deserialize(value.value)
					console.timeEnd('Deserializing a', type)

					return output
				}

				return value
			}),
	}
}
