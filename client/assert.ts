export default function assert(value: any, assertion?: string): asserts value {
	if (!value) {
		const error_message = assertion ? `Assertion failed: "${assertion}"` : 'Assertion failed'
		throw new Error(error_message)
	}
}
