<script lang=ts>
	import array_buffer_to_img from "./array_buffer_to_img"
	import type { Image } from "./line_item_types"

	export let image: Image | null = null

	let canvas: HTMLCanvasElement

	$: context = canvas && canvas.getContext('2d')

	const update_image = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, image: Image) => {
		const img = array_buffer_to_img(image.image, image.mime_type)

		canvas.width = img.width;
		canvas.height = img.height;

		context.drawImage(img, 0, 0)
	}

	$: context && image && update_image(canvas, context, image)
</script>

<canvas bind:this={canvas}></canvas>

<style>
	canvas {
		width: 100%;
		height: 100%;
	}
</style>
