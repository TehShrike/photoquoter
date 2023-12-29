export default (array_buffer: ArrayBuffer) => {
	const byte_array = new Uint8Array(array_buffer)
	let hex_string = '0x'

	for (const byte of byte_array) {
		hex_string += byte.toString(16).padStart(2, '0')
	}

	return hex_string
}
