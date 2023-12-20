// deno-lint-ignore-file no-explicit-any
import omit from './just_omit.ts'

type KeysThatContainUndefined<OBJECT> = {
	[KEY in keyof OBJECT]-?: undefined extends OBJECT[KEY] ? KEY : never
}[keyof OBJECT]
type KeysThatDontContainUndefined<OBJECT> = {
	[KEY in keyof OBJECT]-?: undefined extends OBJECT[KEY] ? never : KEY
}[keyof OBJECT]
type RemoveUndefinedFromValues<OBJECT> = {
	[key in keyof OBJECT]: Exclude<OBJECT[key], undefined>
}
type UndefinedActuallyMeansOptional<OBJECT> =
	& Pick<OBJECT, KeysThatDontContainUndefined<OBJECT>>
	& Partial<RemoveUndefinedFromValues<Pick<OBJECT, KeysThatContainUndefined<OBJECT>>>>

type MightBeOptional<T> = T & { optional?: boolean }

type StringCastingFunction<T> = MightBeOptional<(value: string, name: string) => T>
type StringOrArrayCastingFunction<T> = MightBeOptional<
	(value: string | string[], name: string) => T
>
type StringOrArrayOrUndefinedCastingFunction<T> = MightBeOptional<
	(value: undefined | string | string[], name: string) => T
>

const bad_request_error = (message: string) => {
	const error: Error & { status_code?: number } = new Error(message)
	error.status_code = 400
	return error
}

const ensure_is_defined =
	<T>(cast: StringOrArrayCastingFunction<T>) =>
	(input: string | string[] | undefined, name: string): T => {
		if (input === undefined) {
			throw bad_request_error(`Querystring parameter "${name}" must be provided`)
		}

		return cast(input, name)
	}

const ensure_is_not_array =
	<T>(cast: StringCastingFunction<T>): StringOrArrayCastingFunction<T> =>
	(input: string | string[], name: string): T => {
		if (Array.isArray(input)) {
			throw bad_request_error(`Querystring parameter "${name}" should not be an array`)
		}

		return cast(input, name)
	}

const to_integer = ensure_is_defined(ensure_is_not_array((input: string, name: string): number => {
	const number = parseInt(input, 10)

	if (Number.isNaN(number)) {
		throw bad_request_error(`Querystring parameter "${name}" should be an integer`)
	}

	return number
}))

const to_boolean = ensure_is_defined(ensure_is_not_array((input: string, name: string): boolean => {
	if (input === `true` || input === `1`) {
		return true
	} else if (input === `false` || input === `0`) {
		return false
	}

	throw bad_request_error(`Querystring parameter "${name}" should be a boolean`)
}))

const to_string = ensure_is_defined(
	ensure_is_not_array((input: string, _name: string): string => input),
)

const validate_regex = (regex: RegExp, message?: string) =>
	ensure_is_defined(ensure_is_not_array((input: string, name: string): string => {
		if (!regex.test(input)) {
			throw bad_request_error(
				message || `Querystring parameter "${name}" should match "${regex}"`,
			)
		}

		return input
	}))

const one_of = <T extends string>(...options: T[]) => {
	const set = new Set(options)

	return ensure_is_defined(ensure_is_not_array((input: string, name: string): T => {
		if (!set.has(input as T)) {
			throw bad_request_error(
				`Querystring parameter "${name}" should be ${options.join(`, or `)}`,
			)
		}

		return input as T
	}))
}

import is_valid_iso_date from './is_valid_iso_date.ts'
const to_iso_date = ensure_is_defined(
	ensure_is_not_array((input: string, name: string): IsoDate => {
		if (!is_valid_iso_date(input)) {
			throw bad_request_error(`Querystring parameter "${name}" should be an ISO date`)
		}

		return input
	}),
)

const cast_to_array = <T>(cast: StringCastingFunction<T>) =>
	ensure_is_defined((input: string | string[], name: string): T[] => {
		if (Array.isArray(input)) {
			return input.map((value, index) => cast(value, `${name}[${index}]`))
		}

		return [cast(input, `${name}[0]`)]
	})

const from_entries = <KEY extends string, VALUE>(entries: [KEY, VALUE][]): { [s in KEY]: VALUE } =>
	// @ts-expect-error Object.entries is dumb and always returns string instead of the type of the key
	Object.fromEntries(entries)

const optional = <T>(
	cast: StringOrArrayCastingFunction<T>,
): StringOrArrayOrUndefinedCastingFunction<T | undefined> => {
	const new_cast_function = (input: undefined | string | string[], name: string) =>
		input === undefined ? undefined : cast(input, name)

	new_cast_function.optional = true

	return new_cast_function
}

type CastShape<DESIRED_OBJECT extends { [key: string]: any }> = {
	[key in keyof DESIRED_OBJECT]: StringOrArrayOrUndefinedCastingFunction<DESIRED_OBJECT[key]>
}

const cast_and_return_undefined_on_error = <T>(
	cast_fn: StringOrArrayOrUndefinedCastingFunction<T>,
	value: string | string[] | undefined,
	name: string,
): T | undefined => {
	try {
		return cast_fn(value, name)
	} catch {
		return undefined
	}
}

type MakeValidator = {
	<
		DESIRED_OBJECT extends { [key: string]: any },
		INPUT extends Partial<{ [key in keyof DESIRED_OBJECT]: string | string[] }>,
	>(
		shape: CastShape<DESIRED_OBJECT>,
		options?: { throw_on_invalid_optional_values?: boolean; allow_non_specified_values?: false },
	): () => (object: INPUT) => UndefinedActuallyMeansOptional<DESIRED_OBJECT>
	<
		DESIRED_OBJECT extends { [key: string]: any },
		INPUT extends Partial<{ [key in keyof DESIRED_OBJECT]: string | string[] }>,
	>(
		shape: CastShape<DESIRED_OBJECT>,
		options: { throw_on_invalid_optional_values?: boolean; allow_non_specified_values: true },
	): () => <ACTUAL_INPUT extends INPUT & { [key: string]: string }>(
		object: ACTUAL_INPUT,
	) => UndefinedActuallyMeansOptional<
		DESIRED_OBJECT & { [key in Exclude<keyof ACTUAL_INPUT, keyof INPUT>]: string }
	>
}

const make_validator: MakeValidator = <
	const DESIRED_OBJECT extends { [key: string]: any },
>(shape: CastShape<DESIRED_OBJECT>, {
	throw_on_invalid_optional_values = true,
	allow_non_specified_values,
}: { throw_on_invalid_optional_values?: boolean; allow_non_specified_values?: boolean } = {}) => {
	const officially_accepted_keys = Object.keys(shape)

	return () => (
		object: Partial<{ [key in keyof DESIRED_OBJECT]: string | string[] }>,
	): UndefinedActuallyMeansOptional<DESIRED_OBJECT> => {
		const validated_output_object = from_entries(
			officially_accepted_keys
				.map((key) => {
					const cast = shape[key]
					const input = object[key]

					const can_ignore_errors = !throw_on_invalid_optional_values && cast.optional
					const new_value = can_ignore_errors
						? cast_and_return_undefined_on_error(cast, input, key)
						: cast(input, key)

					return { key, new_value }
				})
				.filter(({ new_value }) => new_value !== undefined)
				.map(({ key, new_value }) => [key, new_value]),
		)

		if (allow_non_specified_values) {
			const other_unknown_values = omit(object, officially_accepted_keys)
			Object.assign(validated_output_object, other_unknown_values)
		}

		// @ts-expect-error I'm giving up on making the type-checker happy with fromEntries until we get const type parameters https://devblogs.microsoft.com/typescript/announcing-typescript-5-0-beta/#const-type-parameters
		return validated_output_object
	}
}

export default Object.assign(make_validator, {
	integer: to_integer,
	boolean: to_boolean,
	string: to_string,
	iso_date: to_iso_date,
	regex: validate_regex,
	one_of,
	array: cast_to_array,
	optional,
})
