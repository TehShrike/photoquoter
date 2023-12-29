export default (array_buffer: ArrayBuffer, mime_type: string) => {
	const blob = new Blob([array_buffer], { type: mime_type })
	const imageUrl = URL.createObjectURL(blob)

	const img = document.createElement('img')
	img.src = imageUrl
	img.onload = () => {
		URL.revokeObjectURL(imageUrl)
	}

	return img
}
