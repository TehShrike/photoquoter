<script lang=ts>
	import CameraImageButton from "./CameraImageButton.svelte"
	import DrawableImage from "./DrawableImage.svelte"
	import image_url_to_image from "./image_url_to_image";

	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher()

	import api from './api_request'

	import type { LineItemImage, Image } from "./line_item_types"

	let image: Image | null = null

	const on_new_image = (new_image: Image) => {
		image = new_image
		dispatch('new_image', new_image)
	}
</script>

<div class=container style="font-weight: bold">
	<div class="row centered-row">
		Line item 1
	</div>
	<div class=row>
		<button>Prev</button>

		<CameraImageButton on:new_image={({ detail: image }) => on_new_image(image)}>
			Take picture
		</CameraImageButton>

		<button>Re-take picture</button>

		<button>Next</button>
	</div>
	<div class="row">
		{#if image}
			<DrawableImage {image} />
		{/if}
	</div>
</div>

<style>
	.container {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		height: 100%;
		width: 100%;
	}

	.row {
		display: flex;
		flex-direction: row;
		width: 100%;
	}

	.centered-row {
		justify-content: center;
	}

	.row > :global(*) {
		flex-grow: 1;
	}

	button {
		background-color: lightgray;
		border: 1px solid black;
		border-radius: 3px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-family: sans-serif;
		font-size: 1em;
		font-weight: normal;
	}
</style>
