export default (image_url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image()

		image.onload = () => {
			resolve(image)
		}

		image.onerror = reject

		image.src = image_url
	})
