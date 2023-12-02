import { assert } from 'std/assert/assert.ts'

function omit<Obj extends object, Key extends keyof Obj>(
	obj: Obj,
	remove: Key[],
): Omit<Obj, Key>

function omit<Obj extends object, Key extends keyof Obj>(
	obj: Obj,
	remove1: Key,
	...removeN: Key[]
): Omit<Obj, Key>

function omit<Obj extends object, Key extends keyof Obj>(
	obj: Obj,
	remove: Key[] | Key,
): Omit<Obj, Key> {
	const result = {}
	if (typeof remove === 'string') {
		remove = [].slice.call(arguments, 1)
	}
	assert(Array.isArray(remove))
	for (const prop in obj) {
		// deno-lint-ignore no-prototype-builtins
		if (!obj.hasOwnProperty || obj.hasOwnProperty(prop)) {
			// @ts-ignore: copy/paste from original JS
			if (remove.indexOf(prop) === -1) {
				// @ts-ignore: copy/paste from original JS
				result[prop] = obj[prop]
			}
		}
	}
	return result as Omit<Obj, Key>
}

export default omit
