<script lang=ts>
	import CameraImageButton from "./CameraImageButton.svelte"
	import DrawableImage from "./DrawableImage.svelte"
	import image_url_to_image from "./image_url_to_image";

	import type { LineItem } from "./line_item_types"

	export let line_item: LineItem

	let data_url: string

	$: line_item.picture_data_url = data_url

	$: image_promise = image_url_to_image(data_url)
</script>

<div class=container style="font-weight: bold">
	<div class="row centered-row">
		Line item 1
	</div>
	<div class=row>
		<button>Prev</button>

		<CameraImageButton bind:data_url>
			Take picture
		</CameraImageButton>

		<button>Re-take picture</button>

		<button>Next</button>
	</div>
	<div class="row">
		{#await image_promise then image}
			<DrawableImage {image} />
		{/await}
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
