// copied from https://github.com/trex-arms/body_validator/blob/main/index.ts

type MessageReturningFunction = (input: unknown, name: string) => string[]

type PredicateFunction<T> = (input: unknown) => input is T

export type Validator<T> = {
	is_valid: PredicateFunction<T>
	get_messages: MessageReturningFunction
}
type NonOptionalPredicateFunction<T> = PredicateFunction<T extends undefined ? never : T>

type NonOptionalValidator<T> = {
	is_valid: NonOptionalPredicateFunction<T>
	get_messages: MessageReturningFunction
}

type StringIndexedObject = {
	[key: string]: unknown
}

const double_quote = (str: string) => `"${str}"`

const is_string = (input: unknown): input is string => typeof input === `string`

const string_validator: Validator<string> = {
	is_valid: is_string,
	get_messages: (input: unknown, name: string) =>
		is_string(input) ? [] : [`${double_quote(name)} is not a string`],
}

const is_number = (input: unknown): input is number => typeof input === `number`

const number_validator: Validator<number> = {
	is_valid: is_number,
	get_messages: (input: unknown, name: string) =>
		is_number(input) ? [] : [`${double_quote(name)} is not a number`],
}

const isInteger = (input: unknown): input is number => Number.isInteger(input)

const integerValidator: Validator<number> = {
	is_valid: isInteger,
	get_messages: (input: unknown, name: string) =>
		is_number(input) ? [] : [`${double_quote(name)} is not an integer`],
}

const isBoolean = (input: unknown): input is boolean => typeof input === `boolean`

const booleanValidator: Validator<boolean> = {
	is_valid: isBoolean,
	get_messages: (input: unknown, name: string) =>
		isBoolean(input) ? [] : [`${double_quote(name)} is not a boolean`],
}

const is_object = (input: unknown): input is StringIndexedObject =>
	!!input && typeof input === `object`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValidatorShape<DesiredObject extends { [key: string]: any }> = {
	[key in keyof DesiredObject]: Validator<DesiredObject[key]>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const keys_plz = <const Key extends string>(object: { [key in Key]: any }): Key[] =>
	Object.keys(object) as Key[]
const values_plz = <const Value>(object: { [key: string]: Value }): Value[] =>
	Object.values(object) as Value[]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const make_object_validator = <const InputObject extends { [key: string]: any }>(
	shape: ValidatorShape<InputObject>,
) => {
	const is_valid = (input: unknown): input is InputObject => {
		if (!is_object(input)) {
			return false
		}

		const allInputKeysExistInShape = keys_plz(input).every((key) => key in shape)

		if (!allInputKeysExistInShape) {
			return false
		}

		return keys_plz(shape).every((key) => {
			const validator = shape[key]

			return validator.is_valid(input[key])
		})
	}

	const get_messages = (input: unknown, name: string) => {
		const quoted_name = double_quote(name)

		if (!is_object(input)) {
			return [`${quoted_name} is not an object`]
		}

		const keys_that_dont_exist_in_shape = keys_plz(input).filter((key) => !(key in shape))
		const property_messages = keys_plz(shape).flatMap((key) => {
			const validator = shape[key]

			return validator.get_messages(input[key], `${name}.${key}`)
		})

		return [
			...keys_that_dont_exist_in_shape.map(
				(key) => `${quoted_name} should not have a property named ${double_quote(key)}`,
			),
			...property_messages,
		]
	}

	return {
		is_valid,
		get_messages,
	}
}

const make_array_validator = <T>(elementValidator: NonOptionalValidator<T>) => {
	const is_valid = (input: unknown): input is T[] => {
		if (!Array.isArray(input)) {
			return false
		}

		return input.every(elementValidator.is_valid)
	}

	const get_messages = (input: unknown, name: string) => {
		if (!Array.isArray(input)) {
			return [`${double_quote(name)} is not an array`]
		}

		return input.flatMap((element, index) =>
			elementValidator.get_messages(element, `${name}[${index}]`)
		)
	}

	return {
		is_valid,
		get_messages,
	}
}

const make_object_values_validator = <T>(elementValidator: NonOptionalValidator<T>) => {
	const is_valid = (input: unknown): input is { [key: string]: T } => {
		if (!is_object(input)) {
			return false
		}

		return values_plz(input).every((value) => elementValidator.is_valid(value))
	}

	const get_messages = (input: unknown, name: string) => {
		if (!is_object(input)) {
			return [`${double_quote(name)} is not an object`]
		}

		return Object.entries(input)
			.filter(([key, value]) => !elementValidator.is_valid(value))
			.flatMap(([key, value]) => elementValidator.get_messages(value, `${name}.${key}`))
	}

	return {
		is_valid,
		get_messages,
	}
}

interface One_of {
	<A>(a: Validator<A>): Validator<A>
	<A, B>(a: Validator<A>, b: Validator<B>): Validator<A | B>
	<A, B, C>(a: Validator<A>, b: Validator<B>, c: Validator<C>): Validator<A | B | C>
	<A, B, C, D>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
	): Validator<A | B | C | D>
	<A, B, C, D, E>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
	): Validator<A | B | C | D | E>
	<A, B, C, D, E, F>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
	): Validator<A | B | C | D | E | F>
	<A, B, C, D, E, F, G>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
	): Validator<A | B | C | D | E | F | G>
	<A, B, C, D, E, F, G, H>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
	): Validator<A | B | C | D | E | F | G | H>
	<A, B, C, D, E, F, G, H, I>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
	): Validator<A | B | C | D | E | F | G | H | I>
	<A, B, C, D, E, F, G, H, I, J>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
	): Validator<A | B | C | D | E | F | G | H | I | J>
	<A, B, C, D, E, F, G, H, I, J, K>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K>
	<A, B, C, D, E, F, G, H, I, J, K, L>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
		l: Validator<L>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K | L>
	<A, B, C, D, E, F, G, H, I, J, K, L, M>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
		l: Validator<L>,
		m: Validator<M>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K | L | M>
	<A, B, C, D, E, F, G, H, I, J, K, L, M, N>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
		l: Validator<L>,
		m: Validator<M>,
		n: Validator<N>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K | L | M | N>
	<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
		l: Validator<L>,
		m: Validator<M>,
		n: Validator<N>,
		o: Validator<O>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O>
	<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
		l: Validator<L>,
		m: Validator<M>,
		n: Validator<N>,
		o: Validator<O>,
		p: Validator<P>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P>
	<A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q>(
		a: Validator<A>,
		b: Validator<B>,
		c: Validator<C>,
		d: Validator<D>,
		e: Validator<E>,
		f: Validator<F>,
		g: Validator<G>,
		h: Validator<H>,
		i: Validator<I>,
		j: Validator<J>,
		k: Validator<K>,
		l: Validator<L>,
		m: Validator<M>,
		n: Validator<N>,
		o: Validator<O>,
		p: Validator<P>,
		q: Validator<Q>,
	): Validator<A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q>
}

const one_of: One_of = <T>(...validators: Validator<T>[]): Validator<T> => {
	const is_valid = (input: unknown): input is T =>
		validators.some((validator) => validator.is_valid(input))

	const get_messages = (input: unknown, name: string) => {
		if (!is_valid(input)) {
			const messages = validators
				.filter((validator) => !validator.is_valid(input))
				.map((validator) => `(${validator.get_messages(input, name).join(', and ')})`)

			return [`(${messages.join(`, or `)})`]
		}
		return []
	}

	return {
		is_valid,
		get_messages,
	}
}

// eslint-disable-next-line @rushstack/no-new-null
const null_validator: Validator<null> = {
	// eslint-disable-next-line @rushstack/no-new-null
	is_valid(input: unknown): input is null {
		return input === null
	},
	get_messages(input: unknown, name: string) {
		if (input !== null) {
			return [`${double_quote(name)} should be null`]
		}

		return []
	},
}

// eslint-disable-next-line @rushstack/no-new-null
const nullable = <T>(validator: Validator<T>): Validator<T | null> =>
	one_of(validator, null_validator)

const make_regex_validator = <T extends string>(regex: RegExp, custom_message?: string) => ({
	is_valid(input: unknown): input is T {
		return typeof input === `string` && regex.test(input)
	},
	get_messages(input: unknown, name: string) {
		if (typeof input !== `string` || !regex.test(input)) {
			return [
				custom_message ||
				`${double_quote(name)} should be a string that matches ${
					double_quote(regex.toString())
				}`,
			]
		}
		return []
	},
})

const undefinedValidator: Validator<undefined> = {
	is_valid(input: unknown): input is undefined {
		return input === undefined
	},
	get_messages(input: unknown, name: string) {
		if (input !== undefined) {
			return [`${double_quote(name)} should be undefined`]
		}

		return []
	},
}

const make_exact_validator = <const T>(value: T): Validator<T> => ({
	is_valid(input: unknown): input is T {
		return input === value
	},
	get_messages(input: unknown, name: string) {
		if (input !== value) {
			return [`${double_quote(name)} should be "${value}"`]
		}
		return []
	},
})

const optional = <T>(validator: Validator<T>): Validator<T | undefined> =>
	one_of(validator, undefinedValidator)

export default {
	object: make_object_validator,
	array: make_array_validator,
	object_values: make_object_values_validator,
	string: string_validator,
	number: number_validator,
	integer: integerValidator,
	boolean: booleanValidator,
	one_of,
	null: null_validator,
	nullable,
	regex: make_regex_validator,
	optional,
	exact: make_exact_validator,
} as const
