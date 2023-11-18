<script lang=ts>
	import CameraImageButton from "./CameraImageButton.svelte"
	import DrawableImage from "./DrawableImage.svelte"

	let image: HTMLImageElement
</script>

<div class=container style="font-weight: bold">
	<div class="row centered-row">
		Line item 1
	</div>
	<div class=row>
		<button>Prev</button>

		<CameraImageButton bind:image>
			Take picture
		</CameraImageButton>

		<button>Re-take picture</button>

		<button>Next</button>
	</div>
	<div class="row">
		<DrawableImage {image} />
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
