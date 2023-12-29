import make_fancy_serializer from './make_fancy_serializer.ts'
import jv from './json_validator.ts'
// import type { FinancialNumber } from 'shared/number'

const types = {
	date: {
		can_serialize: (value: unknown): value is Date => value instanceof Date,
		serialize: (value: Date) => value.valueOf(),
		deserialize: (value: number) => new Date(value),
	},
	array_buffer: {
		can_serialize: (value: unknown): value is ArrayBuffer => value instanceof ArrayBuffer,
		serialize: (value: ArrayBuffer) => Array.from(new Uint8Array(value)),
		deserialize: (value: number[]) => new Uint8Array(value).buffer,
	},
	// financial_number: {
	// 	can_serialize: (value: unknown): value is FinancialNumber => typeof value?.getPrecision === `function`,
	// 	serialize: (number: FinancialNumber) => number.toString(),
	// 	deserialize: (number_string: string) => fnum(number_string),
	// },
}

const unique_key = `B658FECE-52FB-4772-8D54-64C06AC55A61`

// import financial_number_string_regex from 'shared/financial_number_string_regex'

export const validators = {
	date: jv.object({
		[unique_key]: jv.exact(`date`),
		value: jv.integer,
	}),
	array_buffer: {
		[unique_key]: jv.exact('array_buffer'),
		value: jv.array(jv.number),
	},
	// financial_number: (precision: number) => {
	// 	const regex = financial_number_string_regex(precision)

	// 	return jv.object({
	// 		[unique_key]: jv.exact(`financial_number`),
	// 		value: jv.regex(regex),
	// 	})
	// },
}

export default make_fancy_serializer({
	unique_key,
	types,
})
