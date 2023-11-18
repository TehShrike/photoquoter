<script lang=ts>
	export let image: HTMLImageElement | null

	let canvas: HTMLCanvasElement

	$: context = canvas && canvas.getContext('2d')

	const update_image = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, image: HTMLImageElement) => {
		canvas.width = image.width;
		canvas.height = image.height;
		context.drawImage(image, 0, 0)
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
