import { utc_to_iso_datetime } from './date.ts'

export default (queryParts: TemplateStringsArray, ...values: unknown[]) => {
	return queryParts.reduce((query, queryPart, i) => {
		const valueExists = i < values.length
		const text = query + queryPart

		return valueExists ? text + smarter_escape(values[i]) : text
	}, ``)
}

const smarter_escape = (value: unknown, add_parens_to_arrays = false): string => {
	if (Array.isArray(value)) {
		let result = value.map((element) => smarter_escape(element, true)).join(`, `)
		if (add_parens_to_arrays) {
			result = `(` + result + `)`
		}
		return result
	} else if (value instanceof Date) {
		return `'${utc_to_iso_datetime(value)}'`
	} else if (is_object(value)) {
		return escape(JSON.stringify(value))
	} else if (typeof value !== 'number' || typeof value !== 'string') {
		throw new Error(`Can't escape this value: "${value}"`)
	}

	return escape_string(value)
}

const is_object = (str: unknown): str is object => !!str && typeof str === `object`

// copied from https://unpkg.com/sqlstring@2.3.3/lib/SqlString.js

// deno-lint-ignore no-control-regex
const CHARS_GLOBAL_REGEXP = /[\0\b\t\n\r\x1a\"\'\\]/g // eslint-disable-line no-control-regex
const CHARS_ESCAPE_MAP = {
	'\0': '\\0',
	'\b': '\\b',
	'\t': '\\t',
	'\n': '\\n',
	'\r': '\\r',
	'\x1a': '\\Z',
	'"': '\\"',
	'\'': '\\\'',
	'\\': '\\\\',
}

const escape_string = (val: string) => {
	let chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex = 0
	let escapedVal = ''
	let match

	while ((match = CHARS_GLOBAL_REGEXP.exec(val))) {
		// @ts-expect-error copied from sqlstring
		escapedVal += val.slice(chunkIndex, match.index) + CHARS_ESCAPE_MAP[match[0]]
		chunkIndex = CHARS_GLOBAL_REGEXP.lastIndex
	}

	if (chunkIndex === 0) {
		// Nothing was escaped
		return '\'' + val + '\''
	}

	if (chunkIndex < val.length) {
		return '\'' + escapedVal + val.slice(chunkIndex) + '\''
	}

	return '\'' + escapedVal + '\''
}
