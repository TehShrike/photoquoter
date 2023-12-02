const makeOptional = (pattern: string) => `(?:${pattern})?`

const REGEX_PATTERN = /^([^(]+)(\(.+\))$/

const BASIC_ROUTE_SECTION = `/([^/]+?)`
const OPTIONAL_ROUTE_SECTION = makeOptional(BASIC_ROUTE_SECTION)

export default (str: string) => {
	const keys: string[] = []
	const chunks = str.split(`/`)

	chunks[0] || chunks.shift()

	const pattern = chunks.map((chunk) => {
		const firstCharacter = chunk[0]
		const lastCharacter = chunk[chunk.length - 1]

		if (firstCharacter === `*`) {
			keys.push(`wild`)
			return `/(.*)`
		} else if (firstCharacter === `:`) {
			const optional = lastCharacter === `?`
			const body = chunk.substring(1, optional ? chunk.length - 1 : chunk.length)

			if (body[body.length - 1] === `)`) {
				const match = body.match(REGEX_PATTERN)
				if (match) {
					keys.push(match[1])

					const pattern = `/` + match[2]

					return optional ? makeOptional(pattern) : pattern
				}
			}

			keys.push(body)

			return optional ? OPTIONAL_ROUTE_SECTION : BASIC_ROUTE_SECTION
		} else {
			return `/` + chunk
		}
	}).join(``)

	return {
		keys,
		pattern: new RegExp(`^` + pattern + (keys.length ? `(?:/)?` : ``) + `/?$`, `i`),
	}
}
