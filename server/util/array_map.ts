export default <INPUT, OUTPUT>(
	array: INPUT[],
	mapper: (element: INPUT, index: number) => OUTPUT,
) => {
	const output = Array(array.length)
	for (let i = 0; i < array.length; ++i) {
		output[i] = mapper(array[i], i)
	}
	return output
}
