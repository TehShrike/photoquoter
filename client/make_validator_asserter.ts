import type { Validator } from './json_validator.ts'

export default <T>(validator: Validator<T>) => (object: unknown, name: string) =>
	assert_validator(validator, object, name)

function assert_validator<T>(
	validator: Validator<T>,
	object: unknown,
	name: string,
): asserts object is T {
	const is_valid = validator.is_valid(object)

	if (!is_valid) {
		const messages = validator.get_messages(object, name)
		throw new Error(
			`${messages.length} validation errors:\n\n${
				messages.join('\n\n')
			}\n\n${messages.length} validation errors.`,
		)
	}
}
